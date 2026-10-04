"use client";

import { useActionState } from "react";
import { quoteStay, reserveStay, type BookingResult } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

export function BookingForm({ locale, reference, maxGuests, today }: { locale: Locale; reference: string; maxGuests: number; today: string }) {
  const ar = locale === "ar";
  const [result, quoteAction, quoting] = useActionState<BookingResult, FormData>(quoteStay, {});
  const [reservation, reserveAction, reserving] = useActionState<BookingResult, FormData>(reserveStay, {});
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "SAR" }).format(amount / 100);
  const errors: Record<string, string> = ar ? {
    invalid: "راجع التواريخ وعدد الضيوف والبيانات المطلوبة والحد الأدنى للإقامة.", unavailable: "هذه الإقامة لم تعد متاحة. اختر تواريخ أخرى.",
    expired: "انتهت صلاحية السعر. اطلب سعراً جديداً.", changed: "تغيّر السعر. اطلب سعراً جديداً قبل المتابعة.",
    promo: "رمز العرض غير صالح لهذه الإقامة.", limited: "وصلت إلى الحد اليومي للطلبات.", error: "تعذر إكمال الطلب. حاول مرة أخرى.",
  } : {
    invalid: "Check your dates, guest count, required details and minimum stay.", unavailable: "This stay is no longer available. Choose other dates.",
    expired: "Your quote expired. Request a new price.", changed: "The price changed. Request a new price before continuing.",
    promo: "This promotion is not valid for your stay.", limited: "You have reached the daily request limit.", error: "We could not complete your request. Please try again.",
  };
  const quote = result.quote;
  return <div>
    <form action={quoteAction} className="inquiry-form">
      <input type="hidden" name="reference" value={reference} />
      <div className="form-grid">
        <label>{ar ? "الوصول" : "Check-in"}<input type="date" name="checkIn" min={today} required /></label>
        <label>{ar ? "المغادرة" : "Check-out"}<input type="date" name="checkOut" min={today} required /></label>
        <label>{ar ? "الضيوف" : "Guests"}<input type="number" name="guests" min={1} max={maxGuests} defaultValue={1} required /></label>
        <label>{ar ? "رمز العرض (اختياري)" : "Promo code (optional)"}<input name="promoCode" maxLength={40} /></label>
      </div>
      {result.error && <p role="alert" className="form-error">{errors[result.error]}</p>}
      <button className="button" disabled={quoting || reserving}>{quoting ? (ar ? "جارٍ التحقق…" : "Checking…") : (ar ? "تحقق من التوفر والسعر" : "Check availability & price")}</button>
    </form>
    {quote && <section className="detail-section" aria-live="polite">
      <h3>{ar ? "تفاصيل السعر" : "Your quote"}</h3>
      <p><bdi>{quote.checkIn} → {quote.checkOut}</bdi> · {quote.guests} {ar ? "ضيوف" : "guests"}</p>
      <dl className="quote-breakdown">{([
        [ar ? "الإقامة" : "Accommodation", quote.price.accommodationMinor],
        [ar ? "الخصم" : "Discount", -quote.price.discountMinor],
        [ar ? "التنظيف" : "Cleaning", quote.price.cleaningMinor],
        [ar ? "ضيوف إضافيون" : "Extra guests", quote.price.extraGuestMinor],
        [ar ? "الضريبة" : "Tax", quote.price.taxMinor],
        [ar ? "الإجمالي" : "Total", quote.price.totalMinor],
      ] as [string, number][]).map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{money(amount)}</dd></div>)}</dl>
      <details><summary>{ar ? "سعر كل ليلة" : "Nightly rates"}</summary><dl className="quote-breakdown">{quote.price.nights.map(night => <div key={night.date}><dt>{night.date}</dt><dd>{money(night.amountMinor)}</dd></div>)}</dl></details>
      <p className="muted">{ar ? "السعر صالح لمدة ١٥ دقيقة. لا تُحجز التواريخ حتى إرسال الطلب، ويُراجع التوفر والسعر مجدداً." : "Quote valid for 15 minutes. Dates are held only after submission; availability and price are checked again."}</p>
      <form key={quote.id} action={reserveAction} className="inquiry-form">
        <input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="locale" value={locale} />
        <div className="form-grid">
          <label className="full-width">{ar ? "الاسم الكامل" : "Full name"}<input name="name" minLength={2} maxLength={100} autoComplete="name" required /></label>
          <label>{ar ? "البريد الإلكتروني" : "Email"}<input type="email" name="email" maxLength={254} autoComplete="email" required /></label>
          <label>{ar ? "رقم الجوال" : "Phone"}<input type="tel" name="phone" maxLength={24} autoComplete="tel" required /></label>
          <label className="full-width">{ar ? "الجنسية (اختياري)" : "Nationality (optional)"}<input name="nationality" maxLength={100} /></label>
          <label className="full-width">{ar ? "ملاحظات (اختياري)" : "Notes (optional)"}<textarea name="notes" maxLength={2000} rows={3} /></label>
        </div>
        <label className="consent"><input type="checkbox" name="consent" required /><span>{ar ? "قرأت قواعد الإقامة وسياسة الإلغاء وأوافق على التواصل معي بشأن طلبي." : "I have read the house rules and cancellation policy and agree to be contacted about my request."}</span></label>
        <p>{ar ? "هذا طلب حجز ينتظر تأكيد الفريق. لا يُحصّل أي مبلغ الآن." : "This is a reservation request awaiting staff confirmation. No payment is collected now."}</p>
        {reservation.error && <p role="alert" className="form-error">{errors[reservation.error]}</p>}
        <button className="button" disabled={reserving || quoting}>{reserving ? (ar ? "جارٍ الإرسال…" : "Submitting…") : (ar ? "إرسال طلب الحجز" : "Request reservation")}</button>
      </form>
    </section>}
  </div>;
}
