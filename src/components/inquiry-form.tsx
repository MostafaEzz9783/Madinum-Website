"use client";

import { useActionState } from "react";
import { submitInquiry } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

export function InquiryForm({ locale, management = false, listingReference = "" }: { locale: Locale; management?: boolean; listingReference?: string }) {
  const ar = locale === "ar";
  const [result, action, pending] = useActionState(submitInquiry, { status: "idle" });
  const labels = ar ? {
    name: "الاسم الكامل", phone: "رقم الجوال", email: "البريد الإلكتروني (اختياري)", city: "المدينة", district: "الحي (اختياري)",
    propertyType: "نوع العقار", units: "عدد الوحدات", propertyStatus: "حالة العقار", message: "كيف يمكننا مساعدتك؟",
    consent: "أوافق على استخدام بياناتي للتواصل معي بشأن هذا الطلب.", send: "إرسال الطلب", sending: "جارٍ الإرسال…",
    success: "تم استلام طلبك. سيتواصل معك فريق مدينيوم.", invalid: "يرجى مراجعة الحقول المحددة وإكمال البيانات المطلوبة.",
    error: "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى.", limited: "وصلت إلى الحد اليومي للطلبات. يرجى المحاولة غداً.", choose: "اختر",
  } : {
    name: "Full name", phone: "Phone number", email: "Email (optional)", city: "City", district: "District (optional)",
    propertyType: "Property type", units: "Number of units", propertyStatus: "Current property status", message: "How can we help?",
    consent: "I agree to my details being used to contact me about this request.", send: "Send inquiry", sending: "Sending…",
    success: "Your inquiry has been received. The Madinum team will contact you.", invalid: "Review the highlighted fields and complete the required information.",
    error: "We could not send your inquiry. Please try again.", limited: "You have reached the daily inquiry limit. Please try tomorrow.", choose: "Choose",
  };
  const invalid = (field: string) => result.fields?.includes(field) || undefined;
  if (result.status === "success") return <div className="form-success" role="status"><h3>{ar ? "شكراً لتواصلك" : "Thank you"}</h3><p>{labels.success}</p></div>;
  return <form action={action} className="inquiry-form">
    <input type="hidden" name="type" value={management ? "PROPERTY_MANAGEMENT" : "GENERAL"} />
    <input type="hidden" name="listingReference" value={listingReference} />
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="form-grid">
      <label>{labels.name}<input name="name" required minLength={2} maxLength={100} autoComplete="name" aria-invalid={invalid("name")} /></label>
      <label>{labels.phone}<input name="phone" type="tel" dir="ltr" required maxLength={24} autoComplete="tel" aria-invalid={invalid("phone")} /></label>
      <label className="full-width">{labels.email}<input name="email" type="email" dir="ltr" maxLength={254} autoComplete="email" aria-invalid={invalid("email")} /></label>
      {management ? <>
        <label>{labels.city}<select name="city" required aria-invalid={invalid("city")}><option value="">{labels.choose}</option><option value="jeddah">{ar ? "جدة" : "Jeddah"}</option><option value="riyadh">{ar ? "الرياض" : "Riyadh"}</option><option value="makkah">{ar ? "مكة المكرمة" : "Makkah"}</option></select></label>
        <label>{labels.district}<input name="district" maxLength={100} /></label>
        <label>{labels.propertyType}<select name="propertyType" required aria-invalid={invalid("propertyType")}><option value="">{labels.choose}</option><option value="APARTMENT">{ar ? "شقة" : "Apartment"}</option><option value="VILLA">{ar ? "فيلا" : "Villa"}</option><option value="RESIDENTIAL_BUILDING">{ar ? "عمارة سكنية" : "Residential building"}</option><option value="COMPOUND_UNIT">{ar ? "وحدة في مجمع" : "Compound unit"}</option></select></label>
        <label>{labels.units}<input name="units" type="number" min={1} max={10000} required aria-invalid={invalid("units")} /></label>
        <label className="full-width">{labels.propertyStatus}<select name="propertyStatus" required aria-invalid={invalid("propertyStatus")}><option value="">{labels.choose}</option>{["vacant", "rented", "short-term", "construction", "other"].map((value, index) => <option key={value} value={value}>{(ar ? ["شاغر", "مؤجر", "إيجار قصير", "تحت الإنشاء", "أخرى"] : ["Vacant", "Rented", "Short-term rental", "Under construction", "Other"])[index]}</option>)}</select></label>
      </> : ["city", "district", "propertyType", "units", "propertyStatus"].map(name => <input key={name} type="hidden" name={name} value="" />)}
      <label className="full-width">{labels.message}<textarea name="message" required minLength={10} maxLength={3000} rows={4} aria-invalid={invalid("message")} /></label>
    </div>
    <label className="consent"><input type="checkbox" name="consent" required aria-invalid={invalid("consent")} /><span>{labels.consent}</span></label>
    {result.status !== "idle" && <p className="form-error" role="alert">{labels[result.status]}</p>}
    <button className="button" disabled={pending}>{pending ? labels.sending : labels.send}</button>
  </form>;
}
