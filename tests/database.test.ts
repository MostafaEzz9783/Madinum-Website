import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import pg from "pg";
import { db } from "../src/server/db";

const suffix = randomUUID();
let unitId: string;
let propertyId: string;
const cityId = `test-${suffix}`;
const districtId = `district-${suffix}`;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

before(async () => {
  const city = await db.city.create({ data: { id: cityId, nameAr: "اختبار", nameEn: "Test", districts: {
    create: { id: districtId, nameAr: "اختبار", nameEn: "Test" },
  } } });
  assert.equal(city.id, cityId);
  const property = await db.property.create({ data: {
    districtId, type: "APARTMENT", titleAr: "اختبار", titleEn: "Test",
    descriptionAr: "اختبار", descriptionEn: "Test", addressAr: "اختبار", addressEn: "Test",
    latitude: 21.5, longitude: 39.2, bedrooms: 2, bathrooms: 2, areaSquareMeters: 100,
    amenities: [], isDemo: true,
    units: { create: { reference: `TEST-${suffix}`, nameAr: "اختبار", nameEn: "Test",
      beds: 2, maxGuests: 4, baseRateMinor: 35000, rulesAr: "اختبار", rulesEn: "Test",
      cancellationAr: "اختبار", cancellationEn: "Test" } },
  }, include: { units: true } });
  propertyId = property.id;
  unitId = property.units[0].id;
});

after(async () => {
  if (unitId) {
    await db.occupancy.deleteMany({ where: { unitId } });
    await db.hospitalityUnit.delete({ where: { id: unitId } });
  }
  if (propertyId) await db.property.delete({ where: { id: propertyId } });
  await db.district.deleteMany({ where: { id: districtId } });
  await db.city.deleteMany({ where: { id: cityId } });
  await db.$disconnect();
  await pool.end();
});

async function occupy(start: string, end: string, status = "BLOCKED") {
  return pool.query(`INSERT INTO "Occupancy" (id, "unitId", "startDate", "endDate", status)
    VALUES ($1, $2, $3, $4, $5::"OccupancyStatus")`, [randomUUID(), unitId, start, end, status]);
}

test("database rejects overlaps across blocked and maintenance dates but permits checkout/check-in boundary", async () => {
  await occupy("2030-01-01", "2030-01-03");
  await assert.rejects(occupy("2030-01-02", "2030-01-04", "MAINTENANCE"), { code: "23P01" });
  await occupy("2030-01-03", "2030-01-04", "MAINTENANCE");
});

test("concurrent requests cannot reserve the same inventory", async () => {
  const results = await Promise.allSettled([
    occupy("2030-02-01", "2030-02-03"), occupy("2030-02-01", "2030-02-03"),
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const rejection = results.find(result => result.status === "rejected");
  assert.equal(rejection?.reason.code, "23P01");
});

test("invalid intervals, bookingless holds, and negative nightly rates fail in PostgreSQL", async () => {
  await assert.rejects(occupy("2030-03-02", "2030-03-02"), { code: "23514" });
  await assert.rejects(occupy("2030-03-02", "2030-03-01"), { code: "23514" });
  await assert.rejects(occupy("2030-03-02", "2030-03-03", "HELD"), { code: "23514" });
  await assert.rejects(pool.query('UPDATE "HospitalityUnit" SET "baseRateMinor" = -1 WHERE id = $1', [unitId]), { code: "23514" });
});

test("foreign keys prevent orphaned occupancy", async () => {
  await assert.rejects(pool.query(`INSERT INTO "Occupancy" (id, "unitId", "startDate", "endDate", status)
    VALUES ($1, $2, '2030-04-01', '2030-04-02', 'BLOCKED')`, [randomUUID(), randomUUID()]), { code: "23503" });
});
