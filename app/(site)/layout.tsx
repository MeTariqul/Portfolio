import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";
import { getCopy } from "@/lib/content";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The header is a client component, so its words arrive as props; the
  // footer reads the copy itself (it is a server component).
  const copy = await getCopy();

  return (
    <ToastProvider>
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
    </ToastProvider>
  );
}
