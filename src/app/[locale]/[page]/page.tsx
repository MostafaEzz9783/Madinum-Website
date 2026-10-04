import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/inquiry-form";
import { copy, localeSchema } from "@/lib/i18n";

const pages = ["brokerage", "property-management", "about", "contact"] as const;

async function getPage(params: Promise<{ locale: string; page: string }>) {
  const { locale, page } = await params;
  const parsed = localeSchema.safeParse(locale);
  if (!parsed.success || !pages.includes(page as typeof pages[number])) notFound();
  return { locale: parsed.data, page };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; page: string }> }): Promise<Metadata> {
  const { locale, page } = await getPage(params);
  const text = copy[locale];
  const title = page === "property-management" ? text.management : text[page as "brokerage" | "about" | "contact"];
  return { title: `${title} | ${text.brand}` };
}

export default async function MarketingPage({ params }: { params: Promise<{ locale: string; page: string }> }) {
  const { locale, page } = await getPage(params);
  const ar = locale === "ar";
  const text = copy[locale];
  const title = page === "property-management" ? text.management : text[page as "brokerage" | "about" | "contact"];
  const isContact = page === "contact";
  const isOwner = page === "property-management";
  return <main id="main-content">
    <div className="shell breadcrumbs"><Link href={`/${locale}`}>{text.home}</Link><span aria-hidden="true">/</span><span>{title}</span></div>
    <section className={`page-intro shell ${isContact ? "contact-intro" : ""}`}><p className="section-index">{title}</p><h1>{
      isContact ? (ar ? "نبدأ بالاستماع." : "We begin by listening.") :
      isOwner ? (ar ? "أنت تملك العقار.\nنحن نعتني بالتفاصيل." : "You own the property.\nWe care for the details.") :
      page === "brokerage" ? (ar ? "قرارك العقاري،\nبخطوات أوضح." : "Your property decision.\nA clearer way forward.") :
      (ar ? "منظور أوسع.\nعناية أقرب." : "A wider perspective.\nA closer relationship.")
    }</h1><p>{isOwner ? (ar ? "إدارة تناسب طبيعة عقارك وأهدافك، من وحدة واحدة إلى مبنى سكني." : "Management shaped around your property and your goals, from a single unit to a residential building.") : isContact ? (ar ? "أخبرنا بما تبحث عنه. سنوجّه طلبك إلى الفريق المناسب." : "Tell us what you’re looking for. We’ll connect your inquiry with the right team.") : text.introduction}</p></section>
    {isContact ? <section className="shell contact-layout"><aside><h2>{ar ? "كيف نساعدك؟" : "How can we help?"}</h2><p>{ar ? "شراء أو استئجار، إقامة قصيرة، أو خدمة لعقارك. اترك لنا التفاصيل وطريقة التواصل المناسبة." : "Buying, renting, a short stay, or a service for your property. Leave the details and how to reach you."}</p><p className="muted">{ar ? "للإدارة والتشغيل، يمكنك استخدام نموذج الملاك المفصّل." : "For management and operations, use our dedicated owner inquiry."}</p><Link className="text-link" href={`/${locale}/property-management#inquiry`}>{ar ? "نموذج الملاك" : "Owner inquiry"}</Link></aside><InquiryForm locale={locale} /></section> : <>
      <div className="page-photo shell"><Image src={isOwner || page === "about" ? "/images/interior.jpg" : "/images/architecture.jpg"} alt={ar ? "صورة عقارية توضيحية" : "Editorial property photograph"} fill sizes="100vw" priority /></div>
      <section className="shell service-explanation"><p className="section-index">{ar ? "من البداية إلى التفاصيل" : "FROM THE BIG PICTURE TO THE DETAILS"}</p><div><h2>{isOwner ? (ar ? "خطة واضحة لعقارك." : "A clear plan for your property.") : page === "about" ? (ar ? "حلول عقارية تتحدث معاً." : "Property services that work together.") : (ar ? "نفهم ما يهمك أولاً." : "First, we understand what matters to you.")}</h2><p>{isOwner ? (ar ? "نبدأ بفهم حالة العقار، واستخدامه الحالي، والخدمات التي تحتاجها. ثم نناقش معك نطاق الإدارة ومسؤوليات التشغيل وآلية المتابعة." : "We begin with the condition of your property, its current use, and the support you need. Then we discuss the management scope, operating responsibilities, and reporting process.") : page === "about" ? (ar ? "مدينيوم شركة سعودية للحلول العقارية تجمع الوساطة السكنية والضيافة وإدارة الأملاك. ننظر إلى العقار عبر دورة استخدامه، ونبني خدماتنا حول احتياجات الناس الذين يسكنونه ويملكونه." : "Madinum is a Saudi real estate solutions company bringing together residential brokerage, hospitality, and property management. We see property through its lifecycle and build our services around the people who live in it and own it.") : (ar ? "الميزانية والموقع وطبيعة الاستخدام هي بداية الحوار. ننسّق الخيارات والمعاينات معك، ونوضح الخطوات والمعلومات اللازمة لاتخاذ قرارك. جميع العروض تُراجع وتُنشر بواسطة فريق مدينيوم." : "Budget, location, and how you plan to use the property start the conversation. We coordinate options and viewings, and explain the information you need for your decision. All listings are reviewed and published by the Madinum team.")}</p></div></section>
      <section className="shell service-lines">{(isOwner ? (ar ? ["إدارة الإيجارات طويلة الأجل", "إدارة الإقامات القصيرة", "إدارة المباني السكنية", "التأجير والتسويق", "تنسيق التشغيل والصيانة", "متابعة الملاك والتقارير"] : ["Long-term rental management", "Short-term stay management", "Residential building management", "Leasing and marketing", "Operations and maintenance coordination", "Owner reporting"]) : (ar ? ["نفهم احتياجك", "ننسّق الخطوة التالية", "نبقيك على اطلاع"] : ["Understand your needs", "Coordinate the next step", "Keep you informed"])).map((service, index) => <div key={service}><span>0{index + 1}</span><h3>{service}</h3></div>)}</section>
      {isOwner ? <section className="shell contact-layout" id="inquiry"><aside><p className="section-index">{ar ? "ابدأ من هنا" : "START HERE"}</p><h2>{ar ? "حدثنا عن عقارك." : "Tell us about your property."}</h2><p>{ar ? "نراجع التفاصيل ونتواصل معك لمناقشة الخدمة المناسبة. إرسال الطلب لا يعني نشر العقار أو إبرام اتفاق إدارة." : "We’ll review the details and discuss the right service with you. Submitting an inquiry does not publish a listing or establish a management agreement."}</p></aside><InquiryForm locale={locale} management /></section> : <section className="shell contact-strip"><h2>{ar ? "ما خطوتك القادمة؟" : "What’s your next step?"}</h2><Link className="button" href={`/${locale}/contact`}>{text.contact}</Link></section>}
    </>}
  </main>;
}
