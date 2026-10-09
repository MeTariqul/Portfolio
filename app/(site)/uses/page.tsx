import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { getUses, getCopy } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy["uses.title"],
    description: copy["uses.metaDescription"],
  };
}

export const revalidate = 60;

export default async function UsesPage() {
  const [items, copy] = await Promise.all([getUses(), getCopy()]);
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.group ?? copy["uses.otherGroup"];
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="text-4xl">{copy["uses.title"]}</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          {copy["uses.intro"]}
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
