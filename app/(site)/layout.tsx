import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultOgImage, websiteJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { getCopy } from "@/lib/content";

// Fallback social cards for every public page that does not describe its own
// (the home page, /uses, /services...). Deliberately no `url`: a fixed og:url
// inherited by every child would advertise the wrong address, and each page
// that cares sets its own.
export const metadata: Metadata = {
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    images: [{ url: defaultOgImage, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    images: [defaultOgImage],
  },
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The header is a client component, so its words arrive as props; the
  // footer reads the copy itself (it is a server component).
  const copy = await getCopy();

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <div className="flex min-h-dvh flex-col">
        <Header
          links={[
            { href: "/about", label: copy["nav.about"] },
            { href: "/projects", label: copy["nav.projects"] },
            { href: "/blog", label: copy["nav.blog"] },
            { href: "/services", label: copy["nav.services"] },
            { href: "/contact", label: copy["nav.contact"] },
          ]}
          labels={{
            main: copy["nav.main"],
            menuOpen: copy["nav.menuOpen"],
            menuClose: copy["nav.menuClose"],
            theme: copy["theme.toggle"],
          }}
        />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
