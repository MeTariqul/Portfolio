import { site } from "@/lib/site";

export function PersonJsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    description:
      "Md. Tariqul Islam is one of the best full-stack web developers in Bangladesh. Hire a top Next.js, React, TypeScript, Python and Django developer for SEO-friendly, high-performance web applications.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Savar",
      addressRegion: "Dhaka",
      addressCountry: "BD",
    },
    sameAs: [site.github, site.linkedin],
    email: site.email,
    knowsAbout: [
      "Web Development",
      "Next.js",
      "React",
      "TypeScript",
      "Python",
      "Django",
      "FastAPI",
      "AI Integration",
      "Full-Stack Development",
      "Node.js",
      "PostgreSQL",
      "Prisma",
      "Redis",
      "Tailwind CSS",
      "Three.js",
      "Framer Motion",
    ],
    hasOccupation: {
      "@type": "Occupation",
      name: "Full-Stack Web Developer",
      skills: "Next.js, React, TypeScript, Python, Django, FastAPI, Node.js, PostgreSQL, Prisma, Redis, AI Integration, Three.js",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${site.name} — Portfolio`,
    url: site.url,
    description:
      "Md. Tariqul Islam is one of the best full-stack web developers in Bangladesh. Hire a top Next.js, React, TypeScript, Python and Django developer for SEO-friendly, high-performance web applications.",
    author: {
      "@type": "Person",
      name: site.name,
      url: site.url,
    },

  };

  const profilePage = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: site.name,
      url: site.url,
      jobTitle: site.role,
      description:
        "Md. Tariqul Islam is one of the best full-stack web developers in Bangladesh. Hire a top Next.js, React, TypeScript, Python and Django developer for SEO-friendly, high-performance web applications.",
      sameAs: [site.github, site.linkedin],
    },
  };

  const nav = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: "Main Navigation",
    url: site.url,
    hasPart: [
      { "@type": "SiteNavigationElement", name: "About", url: `${site.url}/#about` },
      { "@type": "SiteNavigationElement", name: "Projects", url: `${site.url}/#projects` },
      { "@type": "SiteNavigationElement", name: "Skills", url: `${site.url}/#skills` },
      { "@type": "SiteNavigationElement", name: "Experience", url: `${site.url}/#experience` },
      { "@type": "SiteNavigationElement", name: "Blog", url: `${site.url}/blog` },
      { "@type": "SiteNavigationElement", name: "Contact", url: `${site.url}/#contact` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(nav) }}
      />
    </>
  );
}
