import Image from "next/image";
import Link from "next/link";
import type { PublicListing } from "@/server/brokerage";
import type { Locale } from "@/lib/i18n";

export function PropertyCard({ listing, locale }: { listing: PublicListing; locale: Locale }) {
  const property = listing.property;
  const ar = locale === "ar";
  const image = property.images[0];
  const title = ar ? property.titleAr : property.titleEn;
  return <article className="property-card"><Link href={`/${locale}/properties/${listing.reference}`}>
    <div className="property-card-image">{image && <Image src={image.url} alt={ar ? image.altAr : image.altEn} fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" />}<span className="property-badge">{property.isDemo ? (ar ? "عقار تجريبي" : "DEMO PROPERTY") : listing.transaction === "SALE" ? (ar ? "للبيع" : "FOR SALE") : (ar ? "للإيجار" : "FOR RENT")}</span></div>
    <div className="property-card-info"><p className="property-price">{new Intl.NumberFormat(locale, { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(listing.priceMinor / 100)}{listing.transaction === "RENT" && <small>{ar ? " / سنوياً" : " / year"}</small>}</p><h2>{title}</h2><p className="muted">{ar ? property.district.nameAr : property.district.nameEn}، {ar ? property.district.city.nameAr : property.district.city.nameEn}</p><div className="property-facts"><span>{property.bedrooms} {ar ? "غرف" : "beds"}</span><span>{property.bathrooms} {ar ? "حمامات" : "baths"}</span><span>{property.areaSquareMeters} {ar ? "م²" : "m²"}</span></div><p className="property-reference" dir="ltr">{listing.reference}</p></div>
  </Link></article>;
}
