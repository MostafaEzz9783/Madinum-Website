import Link from "next/link";
import { notFound } from "next/navigation";
import { copy, localeSchema } from "@/lib/i18n";
import { db } from "@/server/db";
import { residentialTypes, searchProperties } from "@/server/brokerage";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap } from "@/components/property-map";

export default async function PropertiesPage({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) notFound();
  const locale = parsed.data, ar = locale === "ar", text = copy[locale];
  const query = await searchParams;
  const [result, cities, districts] = await Promise.all([
    searchProperties(query), db.city.findMany({ orderBy: { id: "asc" } }), db.district.findMany({ orderBy: { id: "asc" } }),
  ]);
  const value = (name: string, fallback = "") => typeof query[name] === "string" ? query[name] : fallback;
  const typeNames = ar ? ["شقة", "فيلا", "تاون هاوس", "عمارة سكنية", "أرض سكنية", "دوبلكس", "بنتهاوس", "وحدة في مجمع"] : ["Apartment", "Villa", "Townhouse", "Residential building", "Residential land", "Duplex", "Penthouse", "Compound unit"];
  const queryUrl = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) if (typeof val === "string") next.set(key, val);
    for (const [key, val] of Object.entries(changes)) { if (val === undefined) next.delete(key); else next.set(key, val); }
    return `/${locale}/properties?${next}`;
  };
  return <main id="main-content"><section className="shell page-intro"><p className="section-index">{text.brokerage}</p><h1>{ar ? "مساحة لحياتك القادمة." : "Space for your next chapter."}</h1><p>{ar ? "اكتشف العقارات السكنية للبيع والإيجار، واختر ما يناسب احتياجك." : "Explore residential properties for sale and rent, shaped around your needs."}</p></section>
    <section className="shell"><form className="property-filters" action={`/${locale}/properties`}>
      <input type="hidden" name="view" value={value("view", "list")} />
      <div className="search-row"><label>{ar ? "الغرض" : "Purpose"}<select name="transaction" defaultValue={value("transaction", "SALE")}><option value="SALE">{ar ? "للبيع" : "For sale"}</option><option value="RENT">{ar ? "للإيجار" : "For rent"}</option></select></label>
      <label>{text.city}<select name="city" defaultValue={value("city")}><option value="">{text.allCities}</option>{cities.map(city => <option key={city.id} value={city.id}>{ar ? city.nameAr : city.nameEn}</option>)}</select></label>
      <label>{ar ? "نوع العقار" : "Property type"}<select name="type" defaultValue={value("type")}><option value="">{ar ? "الكل" : "All types"}</option>{residentialTypes.map((type, index) => <option key={type} value={type}>{typeNames[index]}</option>)}</select></label>
      <button className="button">{text.search}</button></div>
      <details className="filter-details"><summary>{ar ? "تصفية متقدمة" : "More filters"}</summary><div className="form-grid">
        <label>{ar ? "الحي" : "District"}<select name="district" defaultValue={value("district")}><option value="">{ar ? "جميع الأحياء" : "All districts"}</option>{districts.filter(district => !value("city") || district.cityId === value("city")).map(district => <option key={district.id} value={district.id}>{ar ? district.nameAr : district.nameEn}</option>)}</select></label>
        {[["minPrice", ar ? "أقل سعر (ر.س)" : "Min price (SAR)"], ["maxPrice", ar ? "أعلى سعر (ر.س)" : "Max price (SAR)"], ["bedrooms", ar ? "الغرف (على الأقل)" : "Bedrooms (minimum)"], ["bathrooms", ar ? "الحمامات (على الأقل)" : "Bathrooms (minimum)"], ["minArea", ar ? "أقل مساحة (م²)" : "Min area (m²)"], ["maxArea", ar ? "أعلى مساحة (م²)" : "Max area (m²)"]].map(([name, label]) => <label key={name}>{label}<input type="number" min={0} name={name} defaultValue={value(name)} /></label>)}
        <label>{ar ? "التأثيث" : "Furnishing"}<select name="furnishing" defaultValue={value("furnishing")}><option value="">{ar ? "الكل" : "Any"}</option><option value="furnished">{ar ? "مفروش" : "Furnished"}</option><option value="unfurnished">{ar ? "غير مفروش" : "Unfurnished"}</option></select></label>
        <label>{ar ? "المرافق" : "Amenities"}<select name="amenities" defaultValue={value("amenities")}><option value="">{ar ? "الكل" : "Any"}</option><option value="parking">{ar ? "موقف سيارات" : "Parking"}</option><option value="elevator">{ar ? "مصعد" : "Elevator"}</option><option value="parking,elevator">{ar ? "موقف ومصعد" : "Parking and elevator"}</option></select></label>
      </div></details>
      <div className="results-toolbar"><label>{ar ? "الترتيب" : "Sort"}<select name="sort" defaultValue={value("sort", "newest")}><option value="newest">{ar ? "الأحدث" : "Newest"}</option><option value="price-asc">{ar ? "السعر: الأقل" : "Price: low to high"}</option><option value="price-desc">{ar ? "السعر: الأعلى" : "Price: high to low"}</option><option value="area-desc">{ar ? "المساحة الأكبر" : "Largest area"}</option></select></label><Link className="text-link" href={`/${locale}/properties`}>{ar ? "مسح الفلاتر" : "Clear filters"}</Link></div>
    </form></section>
    <section className="shell results-section" aria-live="polite">{!result.valid ? <div className="empty-state"><h2>{ar ? "راجع خيارات البحث." : "Check your search filters."}</h2><p>{ar ? "تأكد من نطاق السعر والمساحة والقيم المدخلة." : "Check the price range, area, and entered values."}</p></div> : <>
      <div className="section-heading"><p className="results-count">{result.total} {ar ? "نتيجة" : "results"}</p><nav className="view-switch" aria-label={ar ? "طريقة العرض" : "View mode"}>{["list", "split", "map"].map((view, index) => <Link key={view} className={view === "split" ? "split-option" : ""} aria-current={result.filters.view === view ? "page" : undefined} href={queryUrl({ view })}>{(ar ? ["القائمة", "قائمة وخريطة", "الخريطة"] : ["List", "List + map", "Map"])[index]}</Link>)}</nav></div>
      {result.filters.north !== undefined && <Link className="text-link" href={queryUrl({ north: undefined, south: undefined, east: undefined, west: undefined, page: undefined })}>{ar ? "إزالة حدود الخريطة" : "Clear map area"}</Link>}
      {result.listings.some(listing => listing.property.isDemo) && <p className="demo-notice">{ar ? "محتوى تجريبي لاختبار المنصة. العقارات والصور ليست عروضاً فعلية." : "Demo inventory for platform testing. Properties and photographs are not live offers."}</p>}
      <div className={`catalog-view catalog-${result.filters.view}`}>
      {result.filters.view !== "list" && <PropertyMap locale={locale} bounds={result.filters.north === undefined ? undefined : { north: result.filters.north, south: result.filters.south!, east: result.filters.east!, west: result.filters.west! }} points={result.listings.filter(listing => listing.property.publicLatitude !== null && listing.property.publicLongitude !== null).map(listing => ({ reference: listing.reference, latitude: Number(listing.property.publicLatitude), longitude: Number(listing.property.publicLongitude), title: ar ? listing.property.titleAr : listing.property.titleEn, price: new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(listing.priceMinor / 100) + (ar ? " ر.س" : " SAR"), href: `/${locale}/properties/${listing.reference}` }))} />}
      {result.filters.view !== "map" && (result.listings.length ? <div className="property-grid">{result.listings.map(listing => <PropertyCard key={listing.id} listing={listing} locale={locale} />)}</div> : <div className="empty-state"><h2>{ar ? "لم نجد عقارات بهذه الخيارات." : "No properties match your search."}</h2><p>{ar ? "وسّع نطاق السعر أو اختر مدينة أخرى أو امسح الفلاتر." : "Widen your budget, try another city, or clear your filters."}</p><Link className="button" href={`/${locale}/contact`}>{ar ? "أخبرنا بما تبحث عنه" : "Tell us what you need"}</Link></div>)}
      </div>
      {result.pages > 1 && <nav className="pagination" aria-label={ar ? "صفحات النتائج" : "Result pages"}>{result.filters.page > 1 && <Link href={queryUrl({ page: String(result.filters.page - 1) })}>{ar ? "السابق" : "Previous"}</Link>}<span>{result.filters.page} / {result.pages}</span>{result.filters.page < result.pages && <Link href={queryUrl({ page: String(result.filters.page + 1) })}>{ar ? "التالي" : "Next"}</Link>}</nav>}
    </>}</section>
  </main>;
}
