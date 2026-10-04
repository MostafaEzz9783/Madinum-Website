import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { calculateStayPrice, localToday, stayNights, stayRequestSchema, StayError } from "./pricing";

const publicUnitSelect = {
  id: true, reference: true, nameAr: true, nameEn: true, beds: true, maxGuests: true, baseRateMinor: true,
  minimumNights: true, rulesAr: true, rulesEn: true, cancellationAr: true, cancellationEn: true, checkInTime: true, checkOutTime: true,
  property: { select: { titleAr: true, titleEn: true, descriptionAr: true, descriptionEn: true, bedrooms: true, bathrooms: true,
    amenities: true, isDemo: true, type: true, timezone: true,
    district: { select: { nameAr: true, nameEn: true, city: { select: { nameAr: true, nameEn: true } } } },
    images: { orderBy: { position: "asc" as const }, select: { url: true, altAr: true, altEn: true } },
  } },
} satisfies Prisma.HospitalityUnitSelect;

export async function searchStays(input: { city?: string; guests?: string; checkIn?: string; checkOut?: string }) {
  const guests = Number(input.guests || 1);
  if (!Number.isInteger(guests) || guests < 1 || guests > 100 || (input.city?.length ?? 0) > 80) throw new StayError("invalid");
  let overlap: Prisma.OccupancyWhereInput | undefined;
  let nights: number | undefined;
  if (input.checkIn || input.checkOut) {
    nights = stayNights(input.checkIn || "", input.checkOut || "").length;
    if (input.checkIn! < localToday()) throw new StayError("invalid");
    overlap = { startDate: { lt: new Date(`${input.checkOut}T00:00:00Z`) }, endDate: { gt: new Date(`${input.checkIn}T00:00:00Z`) } };
  }
  return db.hospitalityUnit.findMany({ where: { status: "PUBLISHED", maxGuests: { gte: guests },
    minimumNights: nights ? { lte: nights } : undefined,
    dailyRates: nights ? { none: { date: { gte: new Date(`${input.checkIn}T00:00:00Z`), lt: new Date(`${input.checkOut}T00:00:00Z`) }, minimumNights: { gt: nights } } } : undefined,
    property: input.city ? { district: { cityId: input.city } } : undefined,
    occupancy: overlap ? { none: overlap } : undefined,
  }, select: publicUnitSelect, orderBy: { reference: "asc" }, take: 24 });
}

export function getStay(reference: string) {
  if (reference.length > 50) return Promise.resolve(null);
  return db.hospitalityUnit.findFirst({ where: { reference, status: "PUBLISHED" }, select: publicUnitSelect });
}

async function quoteInside(transaction: Prisma.TransactionClient, input: z.infer<typeof stayRequestSchema>) {
  const unit = await transaction.hospitalityUnit.findFirst({ where: { reference: input.reference, status: "PUBLISHED" },
    include: { pricingRules: true, dailyRates: true, property: { select: { timezone: true } } } });
  if (!unit) throw new StayError("unavailable");
  if (input.checkIn < localToday(unit.property.timezone)) throw new StayError("invalid");
  const price = calculateStayPrice(unit, input.checkIn, input.checkOut, input.guests, input.promoCode);
  const checkIn = new Date(`${input.checkIn}T00:00:00Z`), checkOut = new Date(`${input.checkOut}T00:00:00Z`);
  const occupied = await transaction.occupancy.findFirst({ where: { unitId: unit.id, startDate: { lt: checkOut }, endDate: { gt: checkIn } }, select: { id: true } });
  if (occupied) throw new StayError("unavailable");
  return { unit, price, checkIn, checkOut };
}

export async function createStayQuote(input: unknown) {
  const parsed = stayRequestSchema.safeParse(input);
  if (!parsed.success) throw new StayError("invalid");
  return db.$transaction(async transaction => {
    const { unit, price, checkIn, checkOut } = await quoteInside(transaction, parsed.data);
    const quote = await transaction.bookingQuote.create({ data: {
      unitId: unit.id, checkIn, checkOut, guests: parsed.data.guests, promoCode: parsed.data.promoCode || null,
      totalMinor: price.totalMinor, breakdown: price, expiresAt: new Date(Date.now() + 15 * 60_000),
    } });
    return { id: quote.id, price, checkIn: parsed.data.checkIn, checkOut: parsed.data.checkOut, guests: quote.guests, expiresAt: quote.expiresAt.toISOString() };
  });
}

const guestSchema = z.object({
  quoteId: z.uuid(), name: z.string().trim().min(2).max(100), email: z.email().max(254),
  phone: z.string().trim().transform(value => value.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{8,15}$/)),
  nationality: z.string().trim().max(100).default(""), notes: z.string().trim().max(2000).default(""), consent: z.literal("on"),
});

export async function createReservation(input: unknown) {
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) throw new StayError("invalid");
  const guest = parsed.data;
  const accessToken = randomBytes(32).toString("hex");
  try {
    const booking = await db.$transaction(async transaction => {
      const quote = await transaction.bookingQuote.findUnique({ where: { id: guest.quoteId }, include: { unit: { select: { reference: true } }, booking: { select: { id: true } } } });
      if (!quote || quote.expiresAt <= new Date()) throw new StayError("expired");
      if (quote.booking) throw new StayError("unavailable");
      await transaction.$queryRaw`SELECT id FROM "HospitalityUnit" WHERE id = ${quote.unitId}::uuid FOR UPDATE`;
      if (quote.expiresAt <= new Date()) throw new StayError("expired");
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${guest.phone}, 1))::text`;
      if (await transaction.booking.count({ where: { guestPhone: guest.phone, createdAt: { gte: new Date(Date.now() - 86_400_000) } } }) >= 5) throw new StayError("limited");
      const current = await quoteInside(transaction, { reference: quote.unit.reference, checkIn: quote.checkIn.toISOString().slice(0, 10),
        checkOut: quote.checkOut.toISOString().slice(0, 10), guests: quote.guests, promoCode: quote.promoCode ?? "" });
      if (current.price.totalMinor !== quote.totalMinor || !isDeepStrictEqual(current.price, quote.breakdown)) throw new StayError("changed");
      const counter = await transaction.referenceCounter.upsert({ where: { prefix: "MDN-BKG" }, create: { prefix: "MDN-BKG", value: 1 }, update: { value: { increment: 1 } } });
      return transaction.booking.create({ data: {
        reference: `MDN-BKG-${String(counter.value).padStart(6, "0")}`, unitId: quote.unitId, quoteId: quote.id,
        checkIn: quote.checkIn, checkOut: quote.checkOut, guests: quote.guests, guestName: guest.name, guestEmail: guest.email,
        guestPhone: guest.phone, nationality: guest.nationality || null, notes: guest.notes || null,
        totalMinor: current.price.totalMinor, breakdown: current.price,
        accessTokenHash: createHash("sha256").update(accessToken).digest("hex"),
        occupancy: { create: { unitId: quote.unitId, startDate: quote.checkIn, endDate: quote.checkOut, status: "HELD" } },
        history: { create: { status: "PENDING", note: "Guest reservation request received." } },
      }, select: { reference: true } });
    }, { isolationLevel: "Serializable" });
    return { reference: booking.reference, accessToken };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2004", "P2034"].includes(error.code)) throw new StayError("unavailable");
    throw error;
  }
}

export async function getGuestReservation(reference: string, accessToken: string) {
  if (!/^[a-f0-9]{64}$/.test(accessToken)) return null;
  return db.booking.findFirst({ where: { reference, accessTokenHash: createHash("sha256").update(accessToken).digest("hex") },
    select: { reference: true, status: true, checkIn: true, checkOut: true, guests: true, totalMinor: true, breakdown: true,
      unit: { select: { nameAr: true, nameEn: true, reference: true, property: { select: { isDemo: true } } } } } });
}
