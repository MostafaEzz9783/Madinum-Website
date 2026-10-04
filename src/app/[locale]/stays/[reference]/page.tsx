import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import { localeSchema } from "@/lib/i18n";
import { getStay } from "@/server/hospitality";
import { localToday } from "@/server/pricing";

export default async function StayDetail({ params }: { params: Promise<{ locale: string; reference: string }> }) {
  const route = await params, parsed = localeSchema.safeParse(route.locale);
  if (!parsed.success) notFound();
  const unit = await getStay(route.reference);
  if (!unit) notFound();
  const locale = parsed.data, ar = locale === "ar", property = unit.property;
  return <main id="main-content" className="shell">
    <div className="breadcrumbs"><Link href={`/${locale}/stays`}>{ar ? "الإقامات" : "Stays"}</Link><span>/</span><bdi>{unit.reference}</bdi></div>
    {property.isDemo && <p className="demo-notice">{ar ? "إقامة تجريبية للاختبار فقط. الصور توضيحية والطلبات ليست حجوزات فعلية." : "Demo stay for testing only. Photos are illustrative; requests are not real reservations."}</p>}
    <div className="property-gallery">{property.images.map((image, index) => <div key={image.url}><Image src={image.url} alt={ar ? image.altAr : image.altEn} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 80vw" /></div>)}</div>
    <div className="detail-layout"><article><h1>{ar ? unit.nameAr : unit.nameEn}</h1><p>{ar ? property.district.city.nameAr : property.district.city.nameEn} · {ar ? property.district.nameAr : property.district.nameEn}</p>
      <div className="property-facts"><span>{unit.maxGuests} {ar ? "ضيوف" : "guests"}</span><span>{unit.beds} {ar ? "أسرّة" : "beds"}</span><span>{property.bathrooms} {ar ? "حمامات" : "bathrooms"}</span></div>
      <section className="detail-section"><h2>{ar ? "عن الإقامة" : "About this stay"}</h2><p>{ar ? property.descriptionAr : property.descriptionEn}</p><p>{ar ? "الحد الأدنى لعدد الليالي" : "Minimum nights"}: {unit.minimumNights}</p></section>
      <section className="detail-section"><h2>{ar ? "قواعد الإقامة" : "House rules"}</h2><p>{ar ? unit.rulesAr : unit.rulesEn}</p><p>{ar ? "الوصول" : "Check-in"}: <bdi>{unit.checkInTime}</bdi> · {ar ? "المغادرة" : "Check-out"}: <bdi>{unit.checkOutTime}</bdi></p></section>
      <section className="detail-section"><h2>{ar ? "سياسة الإلغاء" : "Cancellation policy"}</h2><p>{ar ? unit.cancellationAr : unit.cancellationEn}</p></section>
    </article><aside className="detail-inquiry"><h2>{ar ? "خطط لإقامتك" : "Plan your stay"}</h2><BookingForm locale={locale} reference={unit.reference} maxGuests={unit.maxGuests} today={localToday(property.timezone)} /></aside></div>
  </main>;
}
