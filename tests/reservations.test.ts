import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { db } from "../src/server/db";
import { createStayQuote, createReservation, getGuestReservation, searchStays } from "../src/server/hospitality";

const id = `stay-${randomUUID()}`;
let unitId: string;
let propertyId: string;
const guest = { name: "Test Guest", email: "guest@example.test", phone: "+966500001122", consent: "on" };
const request = (checkIn: string, checkOut: string) => ({ reference: id, checkIn, checkOut, guests: 2 });

before(async () => {
  await db.city.create({ data: { id, nameAr: "اختبار", nameEn: "Test", districts: { create: { id, nameAr: "اختبار", nameEn: "Test" } } } });
  const property = await db.property.create({ data: { districtId: id, type: "APARTMENT", titleAr: "اختبار", titleEn: "Test", descriptionAr: "اختبار", descriptionEn: "Test", addressAr: "اختبار", addressEn: "Test", latitude: 21, longitude: 39, bedrooms: 2, bathrooms: 1, areaSquareMeters: 100, amenities: [], isDemo: true,
    units: { create: { reference: id, nameAr: "اختبار", nameEn: "Test", status: "PUBLISHED", beds: 2, maxGuests: 4, baseRateMinor: 35000, rulesAr: "اختبار", rulesEn: "Test", cancellationAr: "اختبار", cancellationEn: "Test" } } }, include: { units: true } });
  propertyId = property.id; unitId = property.units[0].id;
});

after(async () => {
  if (unitId) {
    await db.occupancy.deleteMany({ where: { unitId } });
    await db.bookingStatusHistory.deleteMany({ where: { booking: { unitId } } });
    await db.booking.deleteMany({ where: { unitId } });
    await db.bookingQuote.deleteMany({ where: { unitId } });
    await db.hospitalityUnit.delete({ where: { id: unitId } });
    await db.property.delete({ where: { id: propertyId } });
  }
  await db.district.deleteMany({ where: { id } }); await db.city.deleteMany({ where: { id } }); await db.$disconnect();
});

test("concurrent reservations recheck inventory, ignore client totals, and protect guest confirmation", async () => {
  const quotes = await Promise.all([createStayQuote(request("2031-01-01", "2031-01-03")), createStayQuote(request("2031-01-01", "2031-01-03"))]);
  const results = await Promise.allSettled(quotes.map(quote => createReservation({ ...guest, quoteId: quote.id, totalMinor: 1 })));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const success = results.find(result => result.status === "fulfilled");
  assert.ok(success?.status === "fulfilled");
  const booking = await getGuestReservation(success.value.reference, success.value.accessToken);
  assert.equal(booking?.status, "PENDING"); assert.equal(booking?.totalMinor, 70000);
  assert.equal(await getGuestReservation(success.value.reference, "a".repeat(64)), null);
  assert.equal((await searchStays({ city: id, checkIn: "2031-01-02", checkOut: "2031-01-04" })).length, 0);
  const next = await createStayQuote(request("2031-01-03", "2031-01-04"));
  await createReservation({ ...guest, quoteId: next.id });
  assert.equal(await db.booking.count({ where: { unitId } }), 2);
});

test("expired quotes, changed rates, and blocks reject submission", async () => {
  const expired = await createStayQuote(request("2031-02-01", "2031-02-03"));
  await db.bookingQuote.update({ where: { id: expired.id }, data: { expiresAt: new Date(0) } });
  await assert.rejects(createReservation({ ...guest, quoteId: expired.id }), { code: "expired" });
  const changed = await createStayQuote(request("2031-02-01", "2031-02-03"));
  await db.hospitalityUnit.update({ where: { id: unitId }, data: { baseRateMinor: 40000 } });
  await assert.rejects(createReservation({ ...guest, quoteId: changed.id }), { code: "changed" });
  const blocked = await createStayQuote(request("2031-03-01", "2031-03-03"));
  await db.occupancy.create({ data: { unitId, startDate: new Date("2031-03-02Z"), endDate: new Date("2031-03-04Z"), status: "MAINTENANCE" } });
  await assert.rejects(createReservation({ ...guest, quoteId: blocked.id }), { code: "unavailable" });
  assert.equal(await db.booking.count({ where: { unitId } }), 2);
});
