"use server";

import { createInquiry } from "@/server/crm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createReservation, createStayQuote } from "@/server/hospitality";
import { StayError } from "@/server/pricing";
import { localeSchema } from "@/lib/i18n";

export type BookingResult = { error?: string; quote?: Awaited<ReturnType<typeof createStayQuote>> };

export async function quoteStay(_previous: BookingResult, form: FormData): Promise<BookingResult> {
  try { return { quote: await createStayQuote(Object.fromEntries(form)) }; }
  catch (error) { return { error: error instanceof StayError ? error.code : "error" }; }
}

export async function reserveStay(_previous: BookingResult, form: FormData): Promise<BookingResult> {
  const locale = localeSchema.safeParse(form.get("locale"));
  if (!locale.success) return { error: "invalid" };
  let booking;
  try { booking = await createReservation(Object.fromEntries(form)); }
  catch (error) { return { error: error instanceof StayError ? error.code : "error" }; }
  (await cookies()).set(`booking-access-${booking.reference}`, booking.accessToken, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 86400,
  });
  redirect(`/${locale.data}/reservations/${booking.reference}`);
}

export type InquiryResult = { status: "idle" | "invalid" | "limited" | "success" | "error"; fields?: string[] };

export async function submitInquiry(_previous: InquiryResult, form: FormData): Promise<InquiryResult> {
  try {
    return await createInquiry(Object.fromEntries(form));
  } catch {
    console.error(JSON.stringify({ event: "inquiry_creation_failed" }));
    return { status: "error" };
  }
}
