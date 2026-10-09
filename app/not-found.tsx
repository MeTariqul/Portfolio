import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getCopy } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return { title: copy["notFound.title"] };
}

// Without this the 404 page bakes at build time and copy-screen edits to it
// would only appear on the next deploy.
export const revalidate = 60;

// This page sits outside the site layout (it also renders for URLs that
// match no route at all), so it builds its own header props from the copy.
export default async function NotFound() {
  const copy = await getCopy();

  return (
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
      <main className="flex-1">
        <Container>
          <section className="py-24 md:py-32">
            <p className="text-sm text-soft">{copy["notFound.label"]}</p>
            <h1 className="mt-3 max-w-[680px] text-4xl">
              {copy["notFound.heading"]}
            </h1>
            <p className="mt-5 max-w-[680px] text-soft">
              {copy["notFound.body"]}
            </p>
            <p className="mt-8">
              <Link href="/" prefetch={false} className="link-underline text-accent">
                {copy["notFound.back"]}
              </Link>
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
