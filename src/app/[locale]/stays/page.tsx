import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copy, localeSchema } from "@/lib/i18n";
import { searchStays } from "@/server/hospitality";
import { localToday, StayError } from "@/server/pricing";

export default async function Stays({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) notFound();
  const locale = parsed.data, ar = locale === "ar", text = copy[locale];
  const query = await searchParams;
  const input = Object.fromEntries(["city", "guests", "checkIn", "checkOut"].map(key => [key, typeof query[key] === "string" ? query[key] : ""]));
  let units: Awaited<ReturnType<typeof searchStays>> = [], invalid = false;
  try { units = await searchStays(input); } catch (error) { if (error instanceof StayError) invalid = true; else throw error; }
  return <main id="main-content" className="shell">
    <section className="detail-section"><p className="section-index">MADINUM STAYS</p><h1>{ar ? "مساحة تشبه راحتك." : "Space to feel at home."}</h1><p>{ar ? "اختر المدينة والتواريخ لاستكشاف إقاماتنا. يُحتسب السعر النهائي حسب تفاصيل إقامتك." : "Explore by city and dates. Your final price is calculated for your stay."}</p></section>
    <form className="inquiry-form" action={`/${locale}/stays`}><div className="form-grid">
      <label>{text.city}<select name="city" defaultValue={input.city}><option value="">{text.allCities}</option>{(["jeddah", "riyadh", "makkah"] as const).map(city => <option key={city} value={city}>{text[city]}</option>)}</select></label>
      <label>{ar ? "الضيوف" : "Guests"}<input type="number" name="guests" min={1} max={100} defaultValue={input.guests || 1} /></label>
      <label>{ar ? "الوصول" : "Check-in"}<input type="date" name="checkIn" min={localToday()} defaultValue={input.checkIn} /></label>
      <label>{ar ? "المغادرة" : "Check-out"}<input type="date" name="checkOut" min={localToday()} defaultValue={input.checkOut} /></label>
    </div><button className="button">{text.search}</button></form>
    {invalid ? <p role="alert" className="form-error">{ar ? "أدخل تاريخي الوصول والمغادرة الصحيحين وعدد الضيوف." : "Enter valid check-in and check-out dates and a guest count."}</p> : <section className="similar-section">
      <h2>{ar ? "الإقامات" : "Stays"} · {units.length}</h2>
      {!units.length && <p>{ar ? "لا توجد إقامات مطابقة. جرّب تواريخ أو مدينة أخرى." : "No matching stays. Try other dates or another city."}</p>}
      <div className="property-grid">{units.map(unit => <article key={unit.id}>
        <Link href={`/${locale}/stays/${unit.reference}`}><div className="property-gallery">{unit.property.images[0] && <div><Image src={unit.property.images[0].url} alt={ar ? unit.property.images[0].altAr : unit.property.images[0].altEn} fill sizes="(max-width: 768px) 100vw, 33vw" /></div>}</div><h3>{ar ? unit.nameAr : unit.nameEn}</h3></Link>
        {unit.property.isDemo && <p className="demo-notice">{ar ? "إقامة تجريبية — ليست عرضاً حقيقياً" : "Demo stay — not real inventory"}</p>}
        <p>{ar ? unit.property.district.city.nameAr : unit.property.district.city.nameEn} · {unit.maxGuests} {ar ? "ضيوف" : "guests"} · {unit.beds} {ar ? "أسرّة" : "beds"}</p>
        <p>{ar ? "السعر الأساسي لليلة" : "Base nightly rate"} · {new Intl.NumberFormat(locale, { style: "currency", currency: "SAR" }).format(unit.baseRateMinor / 100)}</p>
      </article>)}</div>
    </section>}
  </main>;
}
