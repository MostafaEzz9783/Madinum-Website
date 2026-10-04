import assert from "node:assert/strict";
import { test } from "node:test";
import type { PricingRule } from "../src/generated/prisma/client";
import { calculateStayPrice, stayNights, localToday } from "../src/server/pricing";

let sequence = 0;
const rule = (type: PricingRule["type"], values: Partial<PricingRule> = {}): PricingRule => ({
  id: `rule-${sequence++}`, unitId: "unit", name: type, type, priority: 0, amountMinor: null, basisPoints: null,
  startDate: null, endDate: null, minimumNights: null, weekdays: [], promoCode: null, active: true, createdAt: new Date(), ...values,
});
const unit = { baseRateMinor: 35000, maxGuests: 4, includedGuests: 2, minimumNights: 1, pricingRules: [] as PricingRule[], dailyRates: [] };
const price = (rules: PricingRule[], start = "2030-01-07", end = "2030-01-09", guests = 2, promo = "") => calculateStayPrice({ ...unit, pricingRules: rules }, start, end, guests, promo);

test("weekday, weekend and mixed-night pricing", () => {
  assert.equal(price([]).totalMinor, 70000);
  const weekend = rule("WEEKEND_RATE", { amountMinor: 45000, weekdays: [5, 6] });
  assert.equal(price([weekend], "2030-01-04", "2030-01-06").totalMinor, 90000);
  assert.equal(price([weekend], "2030-01-03", "2030-01-06").totalMinor, 125000);
});

test("overlapping seasonal/event/manual rules resolve deterministically by priority and specificity", () => {
  const seasonal = rule("SEASONAL_RATE", { amountMinor: 50000, priority: 10 });
  const event = rule("SPECIAL_EVENT_RATE", { amountMinor: 60000, priority: 20 });
  assert.equal(price([event, seasonal]).totalMinor, 120000);
  assert.equal(price([seasonal, event]).totalMinor, 120000);
  assert.equal(price([seasonal, rule("MANUAL_OVERRIDE", { amountMinor: 30000, priority: 30 })]).totalMinor, 60000);
  assert.equal(price([rule("DATE_RANGE_OVERRIDE", { amountMinor: 70000, startDate: new Date("2030-01-08Z"), endDate: new Date("2030-01-09Z") })]).totalMinor, 105000);
});

test("weekly/monthly discounts and promo codes apply to accommodation only", () => {
  const weekly = rule("LENGTH_OF_STAY_DISCOUNT", { basisPoints: 1000, minimumNights: 7, priority: 1 });
  const monthly = rule("LENGTH_OF_STAY_DISCOUNT", { basisPoints: 2000, minimumNights: 28, priority: 2 });
  assert.equal(price([weekly, monthly], "2030-01-01", "2030-01-08").totalMinor, 220500);
  assert.equal(price([weekly, monthly], "2030-01-01", "2030-01-31").totalMinor, 840000);
  assert.equal(price([rule("PROMO_CODE", { promoCode: "WELCOME", basisPoints: 1000 })], undefined, undefined, 2, "welcome").totalMinor, 63000);
  assert.throws(() => price([], undefined, undefined, 2, "INVALID"), { code: "promo" });
});

test("cleaning, extra guests and tax round consistently in minor units", () => {
  const rules = [rule("CLEANING_FEE", { amountMinor: 10000 }), rule("EXTRA_GUEST_FEE", { amountMinor: 5000 }), rule("TAX", { basisPoints: 1500 })];
  const result = price(rules, undefined, undefined, 3);
  assert.equal(result.totalMinor, 103500);
  assert.equal(result.taxMinor, 13500);
  assert.equal(calculateStayPrice({ ...unit, baseRateMinor: 35050, pricingRules: [rule("TAX", { basisPoints: 1500 })] }, "2030-01-07", "2030-01-08", 1).totalMinor, 40308);
});

test("daily rates, minimum stay, invalid dates, occupancy limits, and local date boundaries", () => {
  const daily = { unitId: "unit", date: new Date("2030-01-07Z"), rateMinor: 80000, minimumNights: 2 };
  assert.equal(calculateStayPrice({ ...unit, dailyRates: [daily] }, "2030-01-07", "2030-01-09", 2).totalMinor, 115000);
  assert.throws(() => calculateStayPrice({ ...unit, dailyRates: [daily] }, "2030-01-07", "2030-01-08", 2));
  for (const dates of [["2030-02-30", "2030-03-02"], ["2030-01-01", "2030-01-01"], ["2030-01-02", "2030-01-01"], ["2030-01-01", "2031-01-01"]]) assert.throws(() => stayNights(dates[0], dates[1]));
  assert.throws(() => price([], undefined, undefined, 5));
  assert.equal(localToday("Asia/Riyadh", new Date("2030-01-01T22:00:00Z")), "2030-01-02");
  assert.equal(stayNights("2032-02-28", "2032-03-01").length, 2);
});

test("arrival cleaning fee remains applicable and tax boundary never silently drops tax", () => {
  const arrivalOnly = { startDate: new Date("2030-01-07Z"), endDate: new Date("2030-01-08Z") };
  assert.equal(price([rule("CLEANING_FEE", { amountMinor: 7500, ...arrivalOnly })]).cleaningMinor, 7500);
  assert.throws(() => price([rule("TAX", { basisPoints: 1500, ...arrivalOnly })]), { code: "invalid" });
});
