import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { db } from "../src/server/db";
import { searchProperties, getPropertyListing } from "../src/server/brokerage";

const cityId = `catalog-${randomUUID()}`;
const references: string[] = [];

before(async () => {
  await db.city.create({ data: { id: cityId, nameAr: "اختبار", nameEn: "Test",
    districts: { create: { id: cityId, nameAr: "اختبار", nameEn: "Test" } } } });
  for (let index = 0; index < 11; index++) {
    const reference = `TEST-${randomUUID()}`;
    references.push(reference);
    await db.brokerageListing.create({ data: {
      reference, transaction: "SALE", status: index === 10 ? "DRAFT" : "PUBLISHED", publishedAt: new Date(), priceMinor: (index + 1) * 100000,
      property: { create: { districtId: cityId, type: "APARTMENT", titleAr: "اختبار", titleEn: "Test", descriptionAr: "اختبار", descriptionEn: "Test",
        addressAr: "خاص", addressEn: "Private", latitude: 21.56789, longitude: 39.12345, bedrooms: index % 3 + 1,
        publicLatitude: 21.5 + index * 0.01, publicLongitude: 39.1 + index * 0.01,
        bathrooms: 2, areaSquareMeters: 100 + index * 10, furnished: index % 2 === 0, amenities: ["parking"], isDemo: true } },
    } });
  }
});

after(async () => {
  await db.leadActivity.deleteMany({ where: { lead: { property: { districtId: cityId } } } });
  await db.lead.deleteMany({ where: { property: { districtId: cityId } } });
  await db.brokerageListing.deleteMany({ where: { reference: { in: references } } });
  await db.property.deleteMany({ where: { districtId: cityId } });
  await db.district.deleteMany({ where: { id: cityId } });
  await db.city.deleteMany({ where: { id: cityId } });
  await db.$disconnect();
});

test("catalog filters, sorting and pagination exclude drafts and private coordinates", async () => {
  const first = await searchProperties({ city: cityId, sort: "price-asc" });
  assert.equal(first.valid, true);
  if (!first.valid) return;
  assert.equal(first.total, 10);
  assert.equal(first.listings.length, 9);
  assert.equal(first.listings[0].priceMinor, 100000);
  assert.equal("latitude" in first.listings[0].property, false);
  assert.equal("addressEn" in first.listings[0].property, false);
  const second = await searchProperties({ city: cityId, page: 2, sort: "price-asc" });
  assert.ok(second.valid && second.listings.length === 1 && second.listings[0].priceMinor === 1000000);
  const filtered = await searchProperties({ city: cityId, district: cityId, type: "APARTMENT", minPrice: 3000, maxPrice: 8000,
    bedrooms: 2, bathrooms: 2, minArea: 120, maxArea: 170, furnishing: "furnished", amenities: "parking", sort: "area-desc" });
  assert.ok(filtered.valid);
  if (filtered.valid) assert.deepEqual(filtered.listings.map(listing => listing.priceMinor), [500000, 300000]);
  const empty = await searchProperties({ city: cityId, amenities: "pool" });
  assert.ok(empty.valid && empty.total === 0);
  assert.equal(await getPropertyListing(references[10]), null);
  const bounded = await searchProperties({ city: cityId, north: 21.515, south: 21.495, east: 39.115, west: 39.095 });
  assert.ok(bounded.valid && bounded.total === 2);
});

test("search rejects impossible ranges, abusive pages, and hospitality-only property types", async () => {
  for (const input of [{ minPrice: 100, maxPrice: 10 }, { minArea: 200, maxArea: 100 }, { page: 100000 }, { type: "HOTEL_ROOM" }, { bedrooms: "no" }, { north: 90 }, { north: 100, south: 20, east: 40, west: 30 }, { north: 20, south: 30, east: 40, west: 30 }]) {
    assert.equal((await searchProperties(input)).valid, false);
  }
});
