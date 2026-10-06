import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { getUses } from "@/lib/content";

export const metadata: Metadata = {
  title: "Uses",
  description: "The tools and setup I use day to day.",
};

export const revalidate = 60;

export default async function UsesPage() {
  const items = await getUses();
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.group ?? "Other";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="text-4xl">Uses</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          The tools I reach for daily. This page changes whenever I switch
          something out.
        </p>

        <div className="mt-12 grid gap-12 md:grid-cols-2">
          {Array.from(groups.entries()).map(([group, list]) => (
            <div key={group}>
              <h2 className="text-2xl">{group}</h2>
              <div className="mt-4">
                {list.map((item) => (
                  <div key={item.title} className="border-t border-line py-5">
                    <h3 className="text-lg">{item.title}</h3>
                    <p className="mt-1 text-soft">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
