import "server-only";
import { z } from "zod";
import type { DailyRate, HospitalityUnit, PricingRule } from "@/generated/prisma/client";

export class StayError extends Error {
  constructor(public code: "invalid" | "unavailable" | "expired" | "changed" | "promo" | "limited") { super(code); }
}

export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
export const stayRequestSchema = z.object({
  reference: z.string().min(1).max(50), checkIn: localDateSchema, checkOut: localDateSchema,
  guests: z.coerce.number().int().min(1).max(100), promoCode: z.string().trim().max(40).default(""),
});

export function localToday(timezone = "Asia/Riyadh", now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function stayNights(checkIn: string, checkOut: string) {
  if (!localDateSchema.safeParse(checkIn).success || !localDateSchema.safeParse(checkOut).success) throw new StayError("invalid");
  const start = Date.parse(`${checkIn}T00:00:00Z`), end = Date.parse(`${checkOut}T00:00:00Z`);
  const count = (end - start) / 86_400_000;
  if (count < 1 || count > 90) throw new StayError("invalid");
  return Array.from({ length: count }, (_, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
}

type PriceableUnit = Pick<HospitalityUnit, "baseRateMinor" | "maxGuests" | "includedGuests" | "minimumNights"> & {
  pricingRules: PricingRule[]; dailyRates: DailyRate[];
};
const nightlyTypes = ["BASE_RATE", "WEEKEND_RATE", "SEASONAL_RATE", "DATE_RANGE_OVERRIDE", "SPECIAL_EVENT_RATE", "MANUAL_OVERRIDE"];
const percent = (amount: number, basisPoints: number) => Number((BigInt(amount) * BigInt(basisPoints) + 5000n) / 10000n);

export function calculateStayPrice(unit: PriceableUnit, checkIn: string, checkOut: string, guests: number, promoCode = "") {
  const dates = stayNights(checkIn, checkOut);
  if (!Number.isInteger(guests) || guests < 1 || guests > unit.maxGuests || dates.length < unit.minimumNights) throw new StayError("invalid");
  const rules = unit.pricingRules.filter(rule => rule.active).sort((a, b) => b.priority - a.priority
    || nightlyTypes.indexOf(b.type) - nightlyTypes.indexOf(a.type) || a.id.localeCompare(b.id));
  const matches = (rule: PricingRule, date: string) =>
    (!rule.startDate || rule.startDate.toISOString().slice(0, 10) <= date)
    && (!rule.endDate || date < rule.endDate.toISOString().slice(0, 10))
    && (!rule.minimumNights || dates.length >= rule.minimumNights)
    && (!rule.weekdays.length || rule.weekdays.includes(new Date(`${date}T00:00:00Z`).getUTCDay()));
  const nightly = dates.map(date => {
    const rule = rules.find(rule => nightlyTypes.includes(rule.type) && matches(rule, date));
    const daily = unit.dailyRates.find(rate => rate.date.toISOString().slice(0, 10) === date);
    if (daily && dates.length < daily.minimumNights) throw new StayError("invalid");
    const amountMinor = (daily && rule?.type !== "MANUAL_OVERRIDE" ? daily.rateMinor : rule?.amountMinor) ?? unit.baseRateMinor;
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new StayError("invalid");
    return { date, amountMinor };
  });
  const accommodationMinor = nightly.reduce((sum, night) => sum + night.amountMinor, 0);
  // One rule per fee/discount category. Stay discounts affect lodging only; fees remain explicit.
  const ruleFor = (type: PricingRule["type"]) => rules.find(rule => rule.type === type && dates.every(date => matches(rule, date)));
  const lengthDiscount = ruleFor("LENGTH_OF_STAY_DISCOUNT");
  let discountMinor = percent(accommodationMinor, lengthDiscount?.basisPoints ?? 0);
  if (promoCode) {
    const promo = rules.find(rule => rule.type === "PROMO_CODE" && rule.promoCode?.toUpperCase() === promoCode.toUpperCase() && dates.every(date => matches(rule, date)));
    if (!promo) throw new StayError("promo");
    discountMinor += Math.min(accommodationMinor - discountMinor, promo.amountMinor ?? percent(accommodationMinor - discountMinor, promo.basisPoints ?? 0));
  }
  // A once-per-stay fee uses the arrival date. Do not silently omit a tax
  // when a stay crosses a configured tax boundary: require a staff quote.
  const cleaningMinor = rules.find(rule => rule.type === "CLEANING_FEE" && matches(rule, dates[0]))?.amountMinor ?? 0;
  const extraGuestMinor = dates.reduce((sum, date) => sum + Math.max(0, guests - unit.includedGuests)
    * (rules.find(rule => rule.type === "EXTRA_GUEST_FEE" && matches(rule, date))?.amountMinor ?? 0), 0);
  const subtotalMinor = accommodationMinor - discountMinor + cleaningMinor + extraGuestMinor;
  const taxRates = dates.map(date => rules.find(rule => rule.type === "TAX" && matches(rule, date))?.basisPoints ?? 0);
  if (taxRates.some(rate => rate !== taxRates[0])) throw new StayError("invalid");
  const taxMinor = percent(subtotalMinor, taxRates[0]);
  const totalMinor = subtotalMinor + taxMinor;
  if (!Number.isSafeInteger(totalMinor) || totalMinor < 0 || totalMinor > 2_000_000_000) throw new StayError("invalid");
  return { currency: "SAR", nights: nightly, accommodationMinor, discountMinor, cleaningMinor, extraGuestMinor, taxMinor, totalMinor };
}

export type StayPrice = ReturnType<typeof calculateStayPrice>;
