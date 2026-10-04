import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { copy, localeSchema } from "@/lib/i18n";

export default async function PublicLayout({ children, params }: {
  children: React.ReactNode; params: Promise<{ locale: string }>;
}) {
  const parsed = localeSchema.safeParse((await params).locale);
  if (!parsed.success) notFound();
  const locale = parsed.data;
  const text = copy[locale];
  const links = [
    ["", text.home], ["properties", text.properties], ["stays", text.stays],
    ["property-management", text.management], ["about", text.about], ["contact", text.contact],
  ];
  return <>
    <a className="skip-link" href="#main-content">{text.skip}</a>
    <header className="masthead"><div className="shell">
      <Link href={`/${locale}`} aria-label={text.home}>
        <Image className="brand-logo" src="/madinum-logo.jpeg" alt="مدينيوم — MADINUM" width={1600} height={1500} sizes="112px" priority />
      </Link>
      <nav className="desktop-nav" aria-label={text.home}>{links.map(([path, label]) => <Link key={path} href={`/${locale}/${path}`}>{label}</Link>)}</nav>
      <div className="header-actions"><Suspense><LanguageSwitcher locale={locale} /></Suspense><Link className="button button-small" href={`/${locale}/contact`}>{text.list}</Link></div>
      <details className="mobile-nav"><summary>{locale === "ar" ? "استكشف مدينيوم" : "Explore Madinum"}</summary><nav aria-label={locale === "ar" ? "التنقل" : "Navigation"}>{links.map(([path, label]) => <a key={path} href={`/${locale}/${path}`}>{label}</a>)}</nav></details>
    </div></header>
    {children}
    <footer className="site-footer"><div className="shell footer-grid"><div><p className="footer-wordmark" dir="ltr">MADINUM</p><p>{text.descriptor}</p></div><div><h2>{locale === "ar" ? "مساحتك القادمة" : "Your next space"}</h2><Link href={`/${locale}/brokerage`}>{text.brokerage}</Link><Link href={`/${locale}/stays`}>{text.stays}</Link></div><div><h2>{locale === "ar" ? "للملاك" : "For owners"}</h2><Link href={`/${locale}/property-management`}>{text.management}</Link><Link href={`/${locale}/contact`}>{text.list}</Link></div><div><h2>{text.brand}</h2><Link href={`/${locale}/about`}>{text.about}</Link><Link href={`/${locale}/contact`}>{text.contact}</Link></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} {text.brand}</span><span>{locale === "ar" ? "الصور للتوضيح ولا تمثل عقارات معروضة." : "Editorial photographs do not represent listed properties."}</span></div></footer>
  </>;
}

