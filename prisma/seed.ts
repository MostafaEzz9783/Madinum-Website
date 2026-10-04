import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production") throw new Error("Demo seed is disabled in production.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  await db.$transaction(async tx => {
    for (const [id, ar, en, districtAr, districtEn] of [
      ["jeddah", "جدة", "Jeddah", "الروضة", "Al Rawdah"],
      ["riyadh", "الرياض", "Riyadh", "الياسمين", "Al Yasmin"],
      ["makkah", "مكة المكرمة", "Makkah", "العوالي", "Al Awali"],
    ]) {
      await tx.city.upsert({ where: { id }, update: {}, create: { id, nameAr: ar, nameEn: en } });
      await tx.district.upsert({ where: { id: `${id}-demo` }, update: {}, create: { id: `${id}-demo`, cityId: id, nameAr: districtAr, nameEn: districtEn } });
    }
    for (let index = 0; index < 8; index++) {
      const sale = index < 4;
      const reference = `MDN-${sale ? "S" : "R"}-${9001 + index}`;
      const city = ["jeddah", "riyadh", "makkah"][index % 3];
      const latitude = city === "jeddah" ? 21.57 : city === "riyadh" ? 24.8 : 21.39;
      const longitude = city === "jeddah" ? 39.16 : city === "riyadh" ? 46.63 : 39.87;
      const publicLocation = { publicLatitude: latitude + index * 0.004, publicLongitude: longitude + index * 0.003 };
      const existing = await tx.brokerageListing.findUnique({ where: { reference }, include: { property: true } });
      if (existing) {
        if (!existing.property.isDemo) throw new Error("Refusing to overwrite non-demo inventory");
        await tx.property.update({ where: { id: existing.propertyId }, data: publicLocation });
        continue;
      }
      const villa = index % 3 === 0;
      await tx.brokerageListing.create({ data: {
        reference, transaction: sale ? "SALE" : "RENT", priceMinor: (sale ? 950000 + index * 250000 : 42000 + (index - 4) * 12000) * 100,
        status: "PUBLISHED", publishedAt: new Date(2026, 8, index + 1), featured: index < 3,
        property: { create: {
          districtId: `${city}-demo`, type: villa ? "VILLA" : "APARTMENT",
          titleAr: villa ? "فيلا بفراغات رحبة" : "شقة سكنية بتصميم معاصر", titleEn: villa ? "A villa with room to grow" : "A contemporary residential apartment",
          descriptionAr: "عقار تجريبي لاختبار المنصة، غير متاح للبيع أو التأجير. الصور توضيحية وليست صوراً لهذا العقار.",
          descriptionEn: "Demo property for platform testing, not available to buy or rent. Photographs are illustrative and do not depict this property.",
          addressAr: "موقع تجريبي", addressEn: "Demo location", latitude, longitude, ...publicLocation,
          bedrooms: villa ? 5 : 2 + index % 2, bathrooms: villa ? 4 : 2, areaSquareMeters: villa ? 320 : 130 + index * 10,
          furnished: !sale, amenities: ["parking", "elevator"], isDemo: true,
          images: { create: [{ url: villa ? "/images/architecture.jpg" : "/images/interior.jpg", altAr: "صورة توضيحية لعقار تجريبي", altEn: "Illustrative photo for demo property", position: 0 }] },
        } },
      } });
    }
    for (let index = 0; index < 3; index++) {
      const reference = `MDN-H-${9001 + index}`, city = ["jeddah", "riyadh", "makkah"][index];
      const existing = await tx.hospitalityUnit.findUnique({ where: { reference }, include: { property: true } });
      if (existing) { if (!existing.property.isDemo) throw new Error("Refusing to overwrite non-demo inventory"); continue; }
      await tx.hospitalityUnit.create({ data: {
        reference, nameAr: "إقامة معاصرة — تجريبية", nameEn: "A contemporary stay — demo", status: "PUBLISHED",
        beds: 2, maxGuests: 4, includedGuests: 2, baseRateMinor: 35000 + index * 10000,
        rulesAr: "وحدة تجريبية فقط. يمنع التدخين والحفلات في هذا السيناريو التجريبي.", rulesEn: "Demo unit only. No smoking or parties in this test scenario.",
        cancellationAr: "سياسة تجريبية: يراجع الفريق طلبات الإلغاء. لا يوجد تحصيل مالي أو حجز فعلي.", cancellationEn: "Demo policy: cancellation requests are reviewed by staff. No payment or actual stay is involved.",
        property: { create: {
          districtId: `${city}-demo`, type: "APARTMENT", titleAr: "شقة ضيافة تجريبية", titleEn: "Demo hospitality apartment",
          descriptionAr: "إقامة توضيحية لاختبار البحث والأسعار وطلبات الحجز. ليست وحدة متاحة فعلياً.", descriptionEn: "An illustrative stay for testing search, pricing and reservation requests. This is not actual available inventory.",
          addressAr: "موقع تجريبي", addressEn: "Demo location", latitude: 21.57, longitude: 39.16,
          bedrooms: 2, bathrooms: 2, areaSquareMeters: 120, furnished: true, isDemo: true, amenities: ["parking"],
          images: { create: { url: "/images/interior.jpg", altAr: "صورة توضيحية لإقامة تجريبية", altEn: "Illustrative demo stay photograph", position: 0 } },
        } },
        pricingRules: { create: [
          { type: "WEEKEND_RATE", name: "Demo weekend", weekdays: [5, 6], amountMinor: 45000 + index * 10000 },
          { type: "CLEANING_FEE", name: "Demo cleaning", amountMinor: 7500 },
          { type: "EXTRA_GUEST_FEE", name: "Demo extra guest", amountMinor: 5000 },
          { type: "LENGTH_OF_STAY_DISCOUNT", name: "Demo weekly discount", minimumNights: 7, basisPoints: 1000 },
        ] },
      } });
    }
  }, { timeout: 20000 });
  console.log("Demo cities, eight brokerage listings and three hospitality units are ready.");
} finally { await db.$disconnect(); }
