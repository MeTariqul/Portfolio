import { site } from "@/lib/site";

export function PersonJsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    description:
      "Md. Tariqul Islam is a Full-Stack Web Developer in Bangladesh specializing in Next.js, React, TypeScript, Python, Django, AI integration and SEO-friendly web applications.",
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
      "Portfolio of Md. Tariqul Islam — Full-Stack Web Developer in Bangladesh specializing in Next.js, React, TypeScript, Python, Django and AI-powered web applications.",
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
        "Md. Tariqul Islam is a Full-Stack Web Developer in Bangladesh specializing in Next.js, React, TypeScript, Python, Django, AI integration and SEO-friendly web applications.",
      sameAs: [site.github, site.linkedin],
    },
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
    </>
  );
}
