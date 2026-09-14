import { site } from "@/lib/site";

export function PersonJsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    image: `${site.url}/opengraph.png`,
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
      image: `${site.url}/opengraph.png`,
      jobTitle: site.role,
      description:
        "Md. Tariqul Islam is one of the best full-stack web developers in Bangladesh. Hire a top Next.js, React, TypeScript, Python and Django developer for SEO-friendly, high-performance web applications.",
      sameAs: [site.github, site.linkedin],
    },
  };

  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `${site.name} — Full-Stack Web Development`,
    url: site.url,
    image: `${site.url}/opengraph.png`,
    description:
      "Professional full-stack web development services by Md. Tariqul Islam. Next.js, React, TypeScript, Python, Django, AI integration, and more.",
    provider: {
      "@type": "Person",
      name: site.name,
      url: site.url,
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Web Development Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Full-Stack Web Development",
            description: "Complete web applications using Next.js, React, TypeScript, Node.js, and Python",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "AI/ML Integration",
            description: "AI-powered features using OpenAI, Gemini, LangChain, and custom ML models",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "E-commerce Development",
            description: "Full-featured online stores with payment processing and inventory management",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Performance Optimization",
            description: "Speed improvements, Core Web Vitals optimization, and SEO enhancements",
          },
        },
      ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalService) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(nav) }}
      />
    </>
  );
}
