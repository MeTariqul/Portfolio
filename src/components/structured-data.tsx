import { site } from "@/lib/site";
import type { ProjectItem } from "@/lib/content";
import { projectSlug } from "@/lib/content";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", ...data }),
      }}
    />
  );
}

export type Crumb = { name: string; url: string };

export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  return (
    <JsonLd
      data={{
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function homeCrumb(): Crumb {
  return { name: "Home", url: site.url };
}

export function FaqJsonLd({
  items,
  pageUrl,
}: {
  items: { question: string; answer: string }[];
  pageUrl: string;
}) {
  return (
    <JsonLd
      data={{
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
        url: pageUrl,
      }}
    />
  );
}

export function ItemListJsonLd({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description?: string;
  url: string;
  items: { name: string; url: string; description?: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@type": "ItemList",
        name,
        description,
        url,
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          url: item.url,
          ...(item.description ? { description: item.description } : {}),
        })),
      }}
    />
  );
}

export function ProjectJsonLd({ project }: { project: ProjectItem }) {
  const slug = projectSlug(project.title);
  const pageUrl = `${site.url}/projects/${slug}`;
  const github = project.github || undefined;
  return (
    <JsonLd
      data={{
        "@type": github ? "SoftwareSourceCode" : "CreativeWork",
        name: project.title,
        description: project.desc,
        url: project.link || pageUrl,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        keywords: project.tags.join(", "),
        genre: project.category,
        author: { "@type": "Person", "@id": `${site.url}/#person`, name: site.name, url: site.url },
        ...(github ? { codeRepository: github } : {}),
      }}
    />
  );
}
