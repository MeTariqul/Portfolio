import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { routing } from "@/i18n/routing";
import { getMergedMessages } from "@/lib/messages";
import { getSite } from "@/lib/content";
import { Providers } from "@/components/providers";
import { ScrollProgress } from "@/components/scroll-progress";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const [messages, s] = await Promise.all([getMergedMessages(), getSite()]);

  return (
    <div className={`${space.variable} ${inter.variable} ${mono.variable} bg-bg text-ink antialiased`}>
      <NextIntlClientProvider messages={messages}>
        <Providers>
          <div className="noise-overlay" aria-hidden />
          <ScrollProgress />
          <Navbar />
          <main>{children}</main>
          <Footer siteProfile={s} />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </NextIntlClientProvider>
    </div>
  );
}
