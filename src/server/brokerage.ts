import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { PropertyType, Transaction } from "@/generated/prisma/enums";
import { db } from "./db";

export const residentialTypes = [PropertyType.APARTMENT, PropertyType.VILLA, PropertyType.TOWNHOUSE,
  PropertyType.RESIDENTIAL_BUILDING, PropertyType.RESIDENTIAL_LAND, PropertyType.DUPLEX,
  PropertyType.PENTHOUSE, PropertyType.COMPOUND_UNIT] as const;
const optionalNumber = (max: number) => z.preprocess(value => value === "" ? undefined : value, z.coerce.number().int().min(0).max(max).optional());
const coordinate = (max: number) => z.coerce.number().min(-max).max(max).optional();
export const propertySearchSchema = z.object({
  city: z.string().max(80).default(""), district: z.string().max(100).default(""),
  transaction: z.enum(Transaction).default("SALE"), type: z.union([z.enum(residentialTypes), z.literal("")]).default(""),
  minPrice: optionalNumber(20_000_000), maxPrice: optionalNumber(20_000_000),
  bedrooms: optionalNumber(30), bathrooms: optionalNumber(30),
  minArea: optionalNumber(1_000_000), maxArea: optionalNumber(1_000_000),
  furnishing: z.enum(["", "furnished", "unfurnished"]).default(""),
  amenities: z.string().max(300).default(""),
  sort: z.enum(["newest", "price-asc", "price-desc", "area-desc"]).default("newest"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  north: coordinate(90), south: coordinate(90), east: coordinate(180), west: coordinate(180),
  view: z.enum(["list", "split", "map"]).default("list"),
}).refine(value => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
  { message: "Invalid price range", path: ["maxPrice"] })
  .refine(value => value.minArea === undefined || value.maxArea === undefined || value.minArea <= value.maxArea,
    { message: "Invalid area range", path: ["maxArea"] })
  .refine(value => [value.north, value.south, value.east, value.west].every(v => v === undefined)
    || (value.north !== undefined && value.south !== undefined && value.east !== undefined && value.west !== undefined
      && value.north > value.south && value.east > value.west), { message: "Invalid map bounds", path: ["north"] });

const listingSelect = {
  id: true, reference: true, transaction: true, priceMinor: true,
  property: { select: {
    id: true, type: true, titleAr: true, titleEn: true, descriptionAr: true, descriptionEn: true,
    bedrooms: true, bathrooms: true, areaSquareMeters: true, furnished: true, amenities: true, isDemo: true,
    publicLatitude: true, publicLongitude: true,
    images: { orderBy: { position: "asc" as const }, select: { url: true, altAr: true, altEn: true } },
    district: { select: { nameAr: true, nameEn: true, city: { select: { nameAr: true, nameEn: true } } } },
  } },
} satisfies Prisma.BrokerageListingSelect;

export type PublicListing = Prisma.BrokerageListingGetPayload<{ select: typeof listingSelect }>;

export async function searchProperties(input: unknown) {
  const parsed = propertySearchSchema.safeParse(input);
  if (!parsed.success) return { valid: false as const };
  const filters = parsed.data;
  const where: Prisma.BrokerageListingWhereInput = {
    status: "PUBLISHED", transaction: filters.transaction,
    priceMinor: { gte: filters.minPrice === undefined ? undefined : filters.minPrice * 100,
      lte: filters.maxPrice === undefined ? undefined : filters.maxPrice * 100 },
    property: {
      type: filters.type || { in: [...residentialTypes] },
      districtId: filters.district || undefined,
      district: filters.city ? { cityId: filters.city } : undefined,
      bedrooms: filters.bedrooms === undefined ? undefined : { gte: filters.bedrooms },
      bathrooms: filters.bathrooms === undefined ? undefined : { gte: filters.bathrooms },
      areaSquareMeters: { gte: filters.minArea, lte: filters.maxArea },
      furnished: filters.furnishing ? filters.furnishing === "furnished" : undefined,
      publicLatitude: filters.north === undefined ? undefined : { gte: filters.south, lte: filters.north },
      publicLongitude: filters.east === undefined ? undefined : { gte: filters.west, lte: filters.east },
      amenities: filters.amenities ? { hasEvery: filters.amenities.split(",").map(value => value.trim()).filter(Boolean) } : undefined,
    },
  };
  const orderBy: Prisma.BrokerageListingOrderByWithRelationInput[] = filters.sort === "price-asc" ? [{ priceMinor: "asc" }, { id: "asc" }]
    : filters.sort === "price-desc" ? [{ priceMinor: "desc" }, { id: "asc" }]
    : filters.sort === "area-desc" ? [{ property: { areaSquareMeters: "desc" } }, { id: "asc" }]
    : [{ publishedAt: "desc" }, { id: "asc" }];
  const [listings, total] = await db.$transaction([
    db.brokerageListing.findMany({ where, select: listingSelect, orderBy, take: 9, skip: (filters.page - 1) * 9 }),
    db.brokerageListing.count({ where }),
  ]);
  return { valid: true as const, listings, total, filters, pages: Math.ceil(total / 9) };
}

export async function getPropertyListing(reference: string) {
  if (reference.length > 50) return null;
  return db.brokerageListing.findFirst({ where: { reference, status: "PUBLISHED", property: { type: { in: [...residentialTypes] } } }, select: listingSelect });
}
