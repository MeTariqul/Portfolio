import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import { site } from "@/lib/site";

describe("en.json content accuracy", () => {
  it("has correct meta title with Bangladesh", () => {
    expect(en.meta.title).toContain("Bangladesh");
    expect(en.meta.title).toContain("Full-Stack Web Developer");
  });

  it("has correct meta description with Django and SEO-friendly", () => {
    expect(en.meta.description).toContain("Django");
    expect(en.meta.description).toContain("SEO-friendly");
    expect(en.meta.description).toContain("Bangladesh");
  });

  it("hero subtitle mentions Django and Bangladesh", () => {
    expect(en.hero.subtitle).toContain("Django");
    expect(en.hero.subtitle).toContain("Bangladesh");
  });

  it("hero roles include Django", () => {
    expect(en.hero.roles).toContain("Python & Django");
  });

  it("about stats have correct values", () => {
    const stats = en.about.stats;
    expect(stats[0].value).toBe(4);
    expect(stats[0].label).toBe("Public projects");
    expect(stats[1].value).toBe(15);
    expect(stats[1].label).toBe("Technologies");
    expect(stats[2].value).toBe(2);
    expect(stats[2].label).toBe("Years freelancing");
  });

  it("about terminal lines mention Django and FastAPI", () => {
    const lines = en.about.terminalLines;
    const joined = lines.join(" ");
    expect(joined).toContain("Django");
    expect(joined).toContain("FastAPI");
    expect(joined).toContain("freelance");
  });

  it("services items mention Django and SEO-friendly", () => {
    const items = en.services.items;
    const joined = items.map((i) => `${i.title} ${i.desc}`).join(" ");
    expect(joined).toContain("Django");
    expect(joined).toContain("SEO-friendly");
  });

  it("projects items are factual without fake stats", () => {
    const items = en.projects.items;
    expect(items.length).toBeGreaterThanOrEqual(5);
    const joined = items.map((i) => i.desc).join(" ");
    expect(joined).not.toContain("100+");
    expect(joined).not.toContain("1000+");
    expect(joined).not.toContain("5000+");
  });

  it("process items use professional wording", () => {
    const items = en.process.items;
    expect(items.length).toBe(4);
    expect(items[0].title).toBe("Discover");
    expect(items[1].title).toBe("Design");
    expect(items[2].title).toBe("Build");
    expect(items[3].title).toBe("Ship & Iterate");
  });

  it("contact sub mentions 24-48 hours", () => {
    expect(en.contact.sub).toContain("24-48 hours");
  });

  it("contact confirm body mentions 24-48 hours", () => {
    expect(en.contact.confirmBody).toContain("24-48 hours");
  });

  it("experience items have 4 entries", () => {
    expect(en.experience.items.length).toBe(4);
  });

  it("experience freelance entry mentions Fiverr", () => {
    const freelance = en.experience.items.find((i) =>
      i.role.includes("Freelance")
    );
    expect(freelance).toBeDefined();
    expect(freelance!.org).toBe("Fiverr");
  });
});

describe("site config accuracy", () => {
  it("email is gbtarif37@gmail.com (not fake)", () => {
    expect(site.email).toBe("gbtarif37@gmail.com");
    expect(site.email).not.toContain("hello@metariqul.dev");
    expect(site.email).not.toContain("tariqul@portfolio");
  });

  it("name is Md. Tariqul Islam", () => {
    expect(site.name).toBe("Md. Tariqul Islam");
  });

  it("role is Full-Stack Web Developer", () => {
    expect(site.role).toBe("Full-Stack Web Developer");
  });

  it("location includes Bangladesh", () => {
    expect(site.location).toContain("Bangladesh");
  });

  it("url is metariqul.vercel.app", () => {
    expect(site.url).toBe("https://metariqul.vercel.app");
  });
});

describe("en.json structure completeness", () => {
  it("has all required top-level namespaces", () => {
    const required = [
      "meta",
      "nav",
      "preloader",
      "hero",
      "about",
      "projects",
      "skills",
      "experience",
      "blog",
      "contact",
      "footer",
      "notFound",
      "statement",
      "services",
      "process",
      "testimonials",
      "cta",
    ];
    for (const key of required) {
      expect(en).toHaveProperty(key);
    }
  });

  it("hero has all required fields", () => {
    expect(en.hero).toHaveProperty("greet");
    expect(en.hero).toHaveProperty("name");
    expect(en.hero).toHaveProperty("roles");
    expect(en.hero).toHaveProperty("subtitle");
    expect(en.hero).toHaveProperty("ctaWork");
    expect(en.hero).toHaveProperty("ctaCv");
    expect(en.hero).toHaveProperty("openToWork");
    expect(en.hero).toHaveProperty("status");
    expect(en.hero).toHaveProperty("scroll");
  });

  it("contact has all required fields", () => {
    expect(en.contact).toHaveProperty("label");
    expect(en.contact).toHaveProperty("heading");
    expect(en.contact).toHaveProperty("sub");
    expect(en.contact).toHaveProperty("name");
    expect(en.contact).toHaveProperty("email");
    expect(en.contact).toHaveProperty("message");
    expect(en.contact).toHaveProperty("send");
    expect(en.contact).toHaveProperty("sending");
    expect(en.contact).toHaveProperty("successTitle");
    expect(en.contact).toHaveProperty("successDesc");
    expect(en.contact).toHaveProperty("errors");
    expect(en.contact).toHaveProperty("confirmSubject");
    expect(en.contact).toHaveProperty("confirmBody");
  });

  it("about has terminalLines, stats, badges", () => {
    expect(en.about.terminalLines.length).toBeGreaterThan(5);
    expect(en.about.stats.length).toBe(3);
    expect(en.about.badges.length).toBeGreaterThan(5);
  });

  it("projects has at least 5 items", () => {
    expect(en.projects.items.length).toBeGreaterThanOrEqual(5);
  });

  it("services has 5 items", () => {
    expect(en.services.items.length).toBe(5);
  });

  it("process has 4 items", () => {
    expect(en.process.items.length).toBe(4);
  });

  it("experience has 4 items", () => {
    expect(en.experience.items.length).toBe(4);
  });
});
