import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "مدينيوم | MADINUM",
  description: "مدينيوم للحلول العقارية",
  robots: { index: false, follow: false },
  icons: { icon: "/madinum-logo.jpeg", apple: "/madinum-logo.jpeg" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await headers()).get("x-madinum-locale") === "en" ? "en" : "ar";
  return <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><body>{children}</body></html>;
}
