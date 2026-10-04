import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { localeSchema } from "@/lib/i18n";
import { getGuestReservation } from "@/server/hospitality";

export default async function Reservation({ params }: { params: Promise<{ locale: string; reference: string }> }) {
  const route = await params, parsed = localeSchema.safeParse(route.locale);
  if (!parsed.success) notFound();
  const booking = await getGuestReservation(route.reference, (await cookies()).get(`booking-access-${route.reference}`)?.value ?? "");
  if (!booking) notFound();
  const locale = parsed.data, ar = locale === "ar";
  const statuses: Record<string, string> = ar ? { PENDING: "بانتظار التأكيد", CONFIRMED: "مؤكد", REJECTED: "مرفوض", CANCELLED: "ملغى", COMPLETED: "مكتمل" } : { PENDING: "Awaiting confirmation", CONFIRMED: "Confirmed", REJECTED: "Rejected", CANCELLED: "Cancelled", COMPLETED: "Completed" };
  return <main id="main-content" className="shell"><section className="detail-section">
    {booking.unit.property.isDemo && <p className="demo-notice">{ar ? "طلب تجريبي للاختبار، وليس حجزاً فعلياً." : "Test request for demo inventory, not an actual reservation."}</p>}
    <p className="section-index">{ar ? "طلب الحجز" : "RESERVATION REQUEST"}</p><h1>{statuses[booking.status] ?? booking.status}</h1>
    <p>{ar ? "رقم الطلب" : "Reference"}: <bdi>{booking.reference}</bdi></p>
    <h2>{ar ? booking.unit.nameAr : booking.unit.nameEn}</h2><p><bdi>{booking.checkIn.toISOString().slice(0, 10)} → {booking.checkOut.toISOString().slice(0, 10)}</bdi> · {booking.guests} {ar ? "ضيوف" : "guests"}</p>
    <p>{ar ? "الإجمالي" : "Total"}: {new Intl.NumberFormat(locale, { style: "currency", currency: "SAR" }).format(booking.totalMinor / 100)}</p>
    <p>{booking.status === "PENDING" ? (ar ? "استلمنا طلبك وهو بانتظار مراجعة الفريق. لم يتم تأكيد الحجز ولم يُحصّل أي مبلغ." : "Your request has been received and awaits staff review. Your booking is not confirmed and no payment has been collected.") : (ar ? "هذه هي الحالة الحالية لطلبك." : "This is the current status of your request.")}</p>
    <p className="muted">{ar ? "هذه الصفحة خاصة بهذا المتصفح لمدة ٢٤ ساعة. احتفظ برقم الطلب." : "This page is private to this browser for 24 hours. Keep your reference number."}</p>
    <Link className="button" href={`/${locale}/stays`}>{ar ? "استكشف الإقامات" : "Explore stays"}</Link>
  </section></main>;
}
