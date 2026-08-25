import { site } from "@/lib/site";

export function PersonJsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    description:
      "Full-stack web developer from Savar, Dhaka, Bangladesh. I build fast, cinematic, AI-powered web experiences with Next.js, React, TypeScript, Python and Three.js.",
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
      "AI",
      "Full-Stack Development",
      "Three.js",
      "Node.js",
      "PostgreSQL",
      "Supabase",
      "Tailwind CSS",
      "Framer Motion",
    ],
    hasOccupation: {
      "@type": "Occupation",
      name: "Full-Stack Web Developer",
      skills: "Next.js, React, TypeScript, Python, Three.js, Node.js, PostgreSQL, Supabase",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${site.name} — Portfolio`,
    url: site.url,
    description:
      "Portfolio of Md. Tariqul Islam — Full-stack web developer specializing in Next.js, React, TypeScript, Python and AI-powered web experiences.",
    author: {
      "@type": "Person",
      name: site.name,
      url: site.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/en/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
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
        "Full-stack web developer from Savar, Dhaka, Bangladesh. I build fast, cinematic, AI-powered web experiences with Next.js, React, TypeScript, Python and Three.js.",
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
