import { z } from "zod";

export const localeSchema = z.enum(["ar", "en"]);
export type Locale = z.infer<typeof localeSchema>;

export function switchLocalePath(pathname: string, query: string, locale: Locale) {
  const segments = pathname.split("/");
  segments[1] = locale;
  return `${segments.join("/")}${query ? `?${query}` : ""}`;
}

export const copy = {
  ar: {
    brand: "مدينيوم", descriptor: "حلول عقارية متكاملة", title: "عقارك،", titleEnd: "بمنظور أوسع.",
    introduction: "الوساطة العقارية، والضيافة، وإدارة الأملاك. خدمات متكاملة تجمع احتياجات الساكن والضيف والمالك.",
    skip: "انتقل إلى المحتوى", home: "الرئيسية", properties: "العقارات", stays: "الإقامات",
    management: "إدارة الأملاك", brokerage: "الوساطة العقارية", about: "عن مدينيوم", contact: "تواصل معنا",
    list: "أضف عقارك", buy: "شراء", rent: "إيجار", stay: "إقامة", search: "ابحث", city: "المدينة",
    allCities: "جميع المدن", jeddah: "جدة", riyadh: "الرياض", makkah: "مكة المكرمة",
  },
  en: {
    brand: "MADINUM", descriptor: "Real Estate Solutions", title: "Your property.", titleEnd: "A wider perspective.",
    introduction: "Residential brokerage, hospitality, and property management. Connected services for residents, guests, and owners.",
    skip: "Skip to content", home: "Home", properties: "Properties", stays: "Stays",
    management: "Property Management", brokerage: "Brokerage", about: "About", contact: "Contact",
    list: "List Your Property", buy: "Buy", rent: "Rent", stay: "Stay", search: "Search", city: "City",
    allCities: "All cities", jeddah: "Jeddah", riyadh: "Riyadh", makkah: "Makkah",
  },
} as const;
