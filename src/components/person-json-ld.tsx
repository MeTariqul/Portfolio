import { site } from "@/lib/site";

export function PersonJsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site.url}/#person`,
    name: site.name,
    url: site.url,
    image: `${site.url}/profile.jpg`,
    jobTitle: "Web Developer",
    description:
      "Md. Tariqul Islam is a Web Developer from Bangladesh who builds responsive websites, web applications, business platforms, and e-commerce solutions using Next.js, React, TypeScript, Python, and Django.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Savar",
      addressRegion: "Dhaka",
      addressCountry: "BD",
    },
    sameAs: [site.github, site.linkedin],
    knowsAbout: [
      "Web Development",
      "Next.js",
      "React",
      "TypeScript",
      "Python",
      "Django",
      "FastAPI",
      "AI Integration",
      "Node.js",
      "PostgreSQL",
      "Prisma",
      "Redis",
      "Tailwind CSS",
      "Three.js",
      "Framer Motion",
    ],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Gono Bishwabidyalay",
    },
    hasOccupation: {
      "@type": "Occupation",
      name: "Web Developer",
      skills: "Next.js, React, TypeScript, Python, Django, FastAPI, Node.js, PostgreSQL, Prisma, Redis, AI Integration, Three.js",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: `${site.name} — Web Developer Portfolio`,
    url: site.url,
    description:
      "Official portfolio website of Md. Tariqul Islam, a Web Developer from Bangladesh. View projects, skills, experience, and contact information.",
    author: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
    },
    publisher: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
    },
  };

  const profilePage = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${site.url}/#profilepage`,
    mainEntity: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
      image: `${site.url}/profile.jpg`,
      jobTitle: "Web Developer",
      description:
        "Md. Tariqul Islam is a Web Developer from Bangladesh who builds responsive websites, web applications, business platforms, and e-commerce solutions using Next.js, React, TypeScript, Python, and Django.",
      sameAs: [site.github, site.linkedin],
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Gono Bishwabidyalay",
      },
    },
  };

  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `${site.name} — Web Development`,
    url: site.url,
    image: `${site.url}/profile.jpg`,
    description:
      "Professional web development services by Md. Tariqul Islam, a Web Developer from Bangladesh. Next.js, React, TypeScript, Python, Django, AI integration, and more.",
    provider: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
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
      { "@type": "SiteNavigationElement", name: "About", url: `${site.url}/about` },
      { "@type": "SiteNavigationElement", name: "Projects", url: `${site.url}/projects` },
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