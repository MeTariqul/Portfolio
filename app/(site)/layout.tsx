import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
