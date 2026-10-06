import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Container>
          <section className="py-24 md:py-32">
            <p className="text-sm text-soft">404</p>
            <h1 className="mt-3 max-w-[680px] text-4xl">
              This page doesn&apos;t exist.
            </h1>
            <p className="mt-5 max-w-[680px] text-soft">
              Maybe the link is old, or I moved something and forgot to leave a
              note. The homepage is a good place to start again.
            </p>
            <p className="mt-8">
              <Link href="/" className="link-underline text-accent">
                Back to the homepage
              </Link>
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
