import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InquiryForm } from "@/components/inquiry-form";
import { PropertyCard } from "@/components/property-card";
import { localeSchema } from "@/lib/i18n";
import { getPropertyListing, searchProperties } from "@/server/brokerage";

const loadListing = cache(getPropertyListing);

export async function generateMetadata({ params }: { params: Promise<{ locale: string; reference: string }> }): Promise<Metadata> {
  const { locale, reference } = await params;
  const listing = await loadListing(reference);
  if (!listing) return { title: "Not found" };
  return { title: `${locale === "ar" ? listing.property.titleAr : listing.property.titleEn} | MADINUM` };
}

export default async function PropertyDetail({ params }: { params: Promise<{ locale: string; reference: string }> }) {
  const route = await params;
  const locale = localeSchema.safeParse(route.locale);
  if (!locale.success) notFound();
  const listing = await loadListing(route.reference);
  if (!listing) notFound();
  const ar = locale.data === "ar", property = listing.property;
  const similar = await searchProperties({ transaction: listing.transaction, type: property.type });
  return <main id="main-content" className="shell"><div className="breadcrumbs"><Link href={`/${locale.data}/properties`}>{ar ? "العقارات" : "Properties"}</Link><span>/</span><span dir="ltr">{listing.reference}</span></div>
    {property.isDemo && <p className="demo-notice">{ar ? "عقار تجريبي — غير متاح للبيع أو التأجير. الصور توضيحية." : "Demo property — not available for sale or rent. Photographs are illustrative."}</p>}
    <div className="property-gallery">{property.images.map((image, index) => <div key={image.url}><Image src={image.url} alt={ar ? image.altAr : image.altEn} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 80vw" /></div>)}</div>
    <div className="detail-layout"><article><p className="section-index">{listing.transaction === "SALE" ? (ar ? "للبيع" : "FOR SALE") : (ar ? "للإيجار" : "FOR RENT")}</p><h1>{ar ? property.titleAr : property.titleEn}</h1><p className="muted">{ar ? property.district.nameAr : property.district.nameEn}، {ar ? property.district.city.nameAr : property.district.city.nameEn}</p><p className="detail-price">{new Intl.NumberFormat(locale.data, { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(listing.priceMinor / 100)}{listing.transaction === "RENT" && <small>{ar ? " / سنوياً" : " / year"}</small>}</p><div className="property-facts"><span>{property.bedrooms} {ar ? "غرف" : "bedrooms"}</span><span>{property.bathrooms} {ar ? "حمامات" : "bathrooms"}</span><span>{property.areaSquareMeters} {ar ? "م²" : "m²"}</span><span>{property.furnished ? (ar ? "مفروش" : "Furnished") : (ar ? "غير مفروش" : "Unfurnished")}</span></div><section className="detail-section"><h2>{ar ? "عن العقار" : "About this property"}</h2><p>{ar ? property.descriptionAr : property.descriptionEn}</p></section><section className="detail-section"><h2>{ar ? "المرافق" : "Amenities"}</h2><ul className="amenities">{property.amenities.map(amenity => <li key={amenity}>{({ parking: ar ? "موقف سيارات" : "Parking", elevator: ar ? "مصعد" : "Elevator" } as Record<string, string>)[amenity] ?? amenity}</li>)}</ul></section><section className="detail-section"><h2>{ar ? "الموقع" : "Location"}</h2><p>{ar ? "يُشارك موقع المعاينة بعد التنسيق مع الفريق." : "The viewing location is shared after coordinating with our team."}</p></section></article>
      <aside className="detail-inquiry" id="inquiry"><h2>{ar ? "استفسر أو اطلب معاينة" : "Ask a question or arrange a viewing"}</h2><p className="property-reference" dir="ltr">{listing.reference}</p><InquiryForm locale={locale.data} listingReference={listing.reference} /></aside>
    </div>
    {similar.valid && similar.listings.some(item => item.id !== listing.id) && <section className="similar-section"><h2>{ar ? "عقارات مشابهة" : "Similar properties"}</h2><div className="property-grid">{similar.listings.filter(item => item.id !== listing.id).slice(0, 3).map(item => <PropertyCard key={item.id} listing={item} locale={locale.data} />)}</div></section>}
    <div className="mobile-property-action"><Link className="button" href="#inquiry">{ar ? "استفسر أو اطلب معاينة" : "Inquire / request a viewing"}</Link></div>
  </main>;
}
