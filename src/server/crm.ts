import "server-only";
import { z } from "zod";
import { LeadType, PropertyType } from "@/generated/prisma/enums";
import { db } from "./db";

export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().transform(value => value.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{8,15}$/)),
  email: z.union([z.email().max(254), z.literal("")]),
  type: z.enum([LeadType.GENERAL, LeadType.PROPERTY_MANAGEMENT, LeadType.SELLER, LeadType.LANDLORD, LeadType.BUYER, LeadType.TENANT]),
  listingReference: z.string().max(50).default(""),
  city: z.string().trim().max(100),
  district: z.string().trim().max(100),
  propertyType: z.union([z.enum(PropertyType), z.literal("")]),
  units: z.union([z.literal(""), z.coerce.number().int().min(1).max(10000)]),
  propertyStatus: z.enum(["", "vacant", "rented", "short-term", "construction", "other"]),
  message: z.string().trim().min(10).max(3000),
  consent: z.literal("on"),
  website: z.literal(""),
}).superRefine((value, context) => {
  if (value.type === "PROPERTY_MANAGEMENT") {
    for (const key of ["city", "propertyType", "units", "propertyStatus"] as const) {
      if (!value[key]) context.addIssue({ code: "custom", path: [key], message: "Required" });
    }
  }
});

export async function createInquiry(input: unknown) {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" as const, fields: [...new Set(parsed.error.issues.map(issue => String(issue.path[0])))] };
  const { name, phone, email, type, city, district, propertyType, units, propertyStatus, message, listingReference } = parsed.data;
  return db.$transaction(async transaction => {
    const listing = listingReference ? await transaction.brokerageListing.findFirst({ where: { reference: listingReference, status: "PUBLISHED" }, select: { propertyId: true, transaction: true } }) : null;
    if (listingReference && !listing) return { status: "invalid" as const, fields: ["listingReference"] };
    // Serializes submissions for a contact across all app instances without storing IP addresses.
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${phone}, 0))::text`;
    const recent = await transaction.lead.count({ where: { phone, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (recent >= 5) return { status: "limited" as const };
    await transaction.lead.create({ data: {
      name, phone, email: email || null, type: listing ? (listing.transaction === "SALE" ? "BUYER" : "TENANT") : type, source: "WEBSITE", propertyId: listing?.propertyId,
      details: { city, district, propertyType, units, propertyStatus, message, listingReference, consentAt: new Date().toISOString() },
      activities: { create: { note: "Inquiry received through website; contact consent recorded." } },
    } });
    return { status: "success" as const };
  });
}
