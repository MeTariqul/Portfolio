// Every user-facing word on the public site, as its default value.
// The admin "Copy" screen (app/admin/copy) overrides any of them at runtime
// from Setting{key:"copy"}; a field left empty falls back to the default
// below, so this file is both the catalogue the admin renders and the source
// of truth when nothing is overridden.
//
// What belongs here: visible text, screen-reader labels that are the only
// wording of a control, and SEO descriptions. What does NOT belong here:
//   • identity — name, email, links, location: lib/site.ts;
//   • words owned by a database row (a project's title, a service's body):
//     that row's own admin screen;
//   • branching format lines (plural counts, "N posts matching …"): they stay
//     in the page, where the logic lives;
//   • the home headline, intro, availability note and about story: those are
//     already editable on the Settings screen.
// `long` fields render as textareas; `help` shows under the admin field.

// The catalogue's field shape. `COPY_FIELDS` is `as const` (so keys stay
// literal for autocomplete); this is the widened shape to read it as.
export type CopyFieldInfo = {
  key: string;
  group: string;
  label: string;
  def: string;
  long?: boolean;
  help?: string;
};

export const COPY_FIELDS = [
  // ── Header and footer ───────────────────────────────────────────────
  { key: "nav.main", group: "Header and footer", label: "Main navigation (screen readers)", def: "Main" },
  { key: "nav.about", group: "Header and footer", label: "About link", def: "About" },
  { key: "nav.projects", group: "Header and footer", label: "Projects link", def: "Projects" },
  { key: "nav.blog", group: "Header and footer", label: "Blog link", def: "Blog" },
  { key: "nav.services", group: "Header and footer", label: "Services link", def: "Services" },
  { key: "nav.contact", group: "Header and footer", label: "Contact link", def: "Contact" },
  { key: "nav.menuOpen", group: "Header and footer", label: "Menu button, closed (screen readers)", def: "Open menu" },
  { key: "nav.menuClose", group: "Header and footer", label: "Menu button, open (screen readers)", def: "Close menu" },
  { key: "theme.toggle", group: "Header and footer", label: "Theme toggle (screen readers)", def: "Switch color theme" },
  { key: "footer.nav", group: "Header and footer", label: "Footer navigation (screen readers)", def: "Footer" },
  { key: "footer.copyright", group: "Header and footer", label: "Copyright line", def: "© {year}. Built by me, in plain Next.js.", long: true, help: "{year} is replaced with the current year." },
  { key: "footer.email", group: "Header and footer", label: "Email link", def: "Email" },
  { key: "footer.uses", group: "Header and footer", label: "Uses link", def: "Uses" },
  { key: "footer.rss", group: "Header and footer", label: "RSS link", def: "RSS" },

  // ── Home page ───────────────────────────────────────────────────────
  { key: "home.workLink", group: "Home", label: "\"See my work\" link", def: "See my work" },
  { key: "home.workHeading", group: "Home", label: "Selected work heading", def: "Selected work" },
  { key: "home.allProjects", group: "Home", label: "\"All projects\" link", def: "All projects" },
  { key: "home.writingHeading", group: "Home", label: "Latest writing heading", def: "Latest writing" },
  { key: "home.allPosts", group: "Home", label: "\"All posts\" link", def: "All posts" },
  { key: "home.ctaHeading", group: "Home", label: "Closing call-to-action heading", def: "Have something you want built?", long: true },
  { key: "home.ctaBody", group: "Home", label: "Closing call-to-action paragraph", def: "Tell me what it is. I read every message and reply within a day.", long: true },
  { key: "home.ctaContact", group: "Home", label: "\"Get in touch\" link", def: "Get in touch" },

  // ── About page ──────────────────────────────────────────────────────
  { key: "about.title", group: "About", label: "Page title in search results", def: "About" },
  { key: "about.metaDescription", group: "About", label: "Search result description", def: "The story, education and skills of Md. Tariqul Islam, a web developer from Savar, Dhaka, Bangladesh.", long: true },
  { key: "about.h1", group: "About", label: "Headline", def: "About me" },
  { key: "about.intro", group: "About", label: "Intro paragraph", def: "Md. Tariqul Islam. Web developer in Savar, Dhaka, Bangladesh. I build things for the web and write down what I learn.", long: true },
  { key: "about.enjoyHeading", group: "About", label: "\"What I enjoy\" heading", def: "What I enjoy" },
  { key: "about.timelineHeading", group: "About", label: "Timeline heading", def: "Timeline" },
  { key: "about.skillsHeading", group: "About", label: "Skills heading", def: "Skills" },
  { key: "about.cvHeading", group: "About", label: "CV section heading", def: "Curriculum vitae" },
  { key: "about.cvBody", group: "About", label: "CV section paragraph", def: "The short version of everything above, in one PDF.", long: true },
  { key: "about.cvDownload", group: "About", label: "\"Download CV\" button", def: "Download CV" },
  { key: "about.cvWork", group: "About", label: "\"Work with me\" button", def: "Work with me" },
  { key: "about.cvTools", group: "About", label: "Tool tags under the CV", def: "Next.js, TypeScript, Python, PostgreSQL", help: "Comma separated. Each item becomes a tag." },

  // ── Services page ───────────────────────────────────────────────────
  { key: "services.title", group: "Services", label: "Page title and headline", def: "Services" },
  { key: "services.metaDescription", group: "Services", label: "Search result description", def: "What I offer: web development, AI integration, Python backends and performance work.", long: true },
  { key: "services.intro", group: "Services", label: "Intro paragraph", def: "I take on a small number of projects at a time so each one gets real attention. Here is what I am usually hired for.", long: true },
  { key: "services.howHeading", group: "Services", label: "\"How I work\" heading", def: "How I work" },
  { key: "services.step1Title", group: "Services", label: "Step 1 title", def: "A short conversation" },
  { key: "services.step1Body", group: "Services", label: "Step 1 paragraph", def: "You tell me what you need and who it is for. I ask a few questions and say honestly whether I am the right person.", long: true },
  { key: "services.step2Title", group: "Services", label: "Step 2 title", def: "A fixed quote" },
  { key: "services.step2Body", group: "Services", label: "Step 2 paragraph", def: "You get a price and a timeline before any code is written. No hourly surprises, no scope tricks.", long: true },
  { key: "services.step3Title", group: "Services", label: "Step 3 title", def: "Build and handoff" },
  { key: "services.step3Body", group: "Services", label: "Step 3 paragraph", def: "I build in the open with preview links, then hand over the code, the deployment and a short guide so you are not stuck with me.", long: true },

  // ── Projects ────────────────────────────────────────────────────────
  { key: "projects.title", group: "Projects", label: "Page title, headline and breadcrumb", def: "Projects" },
  { key: "projects.metaDescription", group: "Projects", label: "Search result description", def: "Case studies of web apps, tools and automations built by Md. Tariqul Islam.", long: true },
  { key: "projects.intro", group: "Projects", label: "Intro paragraph", def: "Each one started as a problem worth solving. Open a project to read the full story: the problem, what I built, and what I took away.", long: true },
  { key: "projects.filterCategory", group: "Projects", label: "Category filter label (screen readers)", def: "Filter by category" },
  { key: "projects.filterTech", group: "Projects", label: "Technology filter label (screen readers)", def: "Filter by technology" },
  { key: "projects.shownSr", group: "Projects", label: "Filter result count (screen readers)", def: "{n} projects shown", help: "{n} is replaced with the number of projects." },
  { key: "projects.empty", group: "Projects", label: "Shown when there are no projects", def: "No projects to show yet.", long: true },
  { key: "projects.noMatch", group: "Projects", label: "Shown when a filter matches nothing", def: "Nothing matches that combination. Try clearing a filter.", long: true },
  { key: "projects.notFound", group: "Projects", label: "Missing project, page title", def: "Project not found" },
  { key: "project.live", group: "Projects", label: "\"Live site\" button", def: "Live site" },
  { key: "project.problemHeading", group: "Projects", label: "\"The problem\" heading", def: "The problem" },
  { key: "project.builtHeading", group: "Projects", label: "\"What I built\" heading", def: "What I built" },
  { key: "project.screenshotsHeading", group: "Projects", label: "\"Screenshots\" heading", def: "Screenshots" },
  { key: "project.learnedHeading", group: "Projects", label: "\"What I learned\" heading", def: "What I learned" },
  { key: "project.backLink", group: "Projects", label: "\"Back to all projects\" link", def: "Back to all projects" },

  // ── Blog ────────────────────────────────────────────────────────────
  { key: "blog.title", group: "Blog", label: "Page title and headline", def: "Blog" },
  { key: "blog.metaDescription", group: "Blog", label: "Search result description", def: "Notes on web development, Python and AI by Md. Tariqul Islam.", long: true },
  { key: "blog.intro", group: "Blog", label: "Intro paragraph", def: "Notes on things I learn while building. No schedule, no newsletter pressure. Read whichever one looks useful.", long: true },
  { key: "blog.search", group: "Blog", label: "Search field label and placeholder", def: "Search posts" },
  { key: "blog.searchBtn", group: "Blog", label: "Search button", def: "Search" },
  { key: "blog.tagAria", group: "Blog", label: "Tag filter (screen readers)", def: "Filter by tag" },
  { key: "blog.clear", group: "Blog", label: "\"clear\" link after a search", def: "clear" },
  { key: "blog.noPosts", group: "Blog", label: "Shown when a search finds nothing", def: "No posts found. Try a different search.", long: true },
  { key: "blog.pageAria", group: "Blog", label: "Pagination (screen readers)", def: "Pagination" },
  { key: "blog.newer", group: "Blog", label: "\"Newer posts\" link", def: "← Newer posts" },
  { key: "blog.older", group: "Blog", label: "\"Older posts\" link", def: "Older posts →" },
  { key: "blog.pageOf", group: "Blog", label: "Page counter", def: "Page {page} of {total}", help: "{page} and {total} are replaced with the page numbers." },
  { key: "blog.postNavAria", group: "Blog", label: "Newer/older post navigation (screen readers)", def: "Post navigation" },
  { key: "blog.postNewer", group: "Blog", label: "Newer post link", def: "← Newer: {title}", help: "{title} is replaced with the post title." },
  { key: "blog.postOlder", group: "Blog", label: "Older post link", def: "Older: {title} →", help: "{title} is replaced with the post title." },
  { key: "blog.onThisPage", group: "Blog", label: "Table of contents label", def: "On this page" },
  { key: "blog.tocAria", group: "Blog", label: "Table of contents (screen readers)", def: "Table of contents" },
  { key: "blog.attachments", group: "Blog", label: "\"Attachments\" heading", def: "Attachments" },
  { key: "blog.related", group: "Blog", label: "\"Related posts\" heading", def: "Related posts" },
  { key: "blog.notFound", group: "Blog", label: "Missing post, page title", def: "Post not found" },
  { key: "post.readTime", group: "Blog", label: "Reading time", def: "{n} min read", help: "{n} is replaced with the number of minutes." },
  { key: "share.label", group: "Blog", label: "\"Share:\" label", def: "Share:" },
  { key: "share.x", group: "Blog", label: "X share link", def: "X" },
  { key: "share.copy", group: "Blog", label: "\"Copy link\" button", def: "Copy link" },
  { key: "share.copied", group: "Blog", label: "\"Copy link\" button after copying", def: "Link copied" },

  // ── Uses page ───────────────────────────────────────────────────────
  { key: "uses.title", group: "Uses", label: "Page title and headline", def: "Uses" },
  { key: "uses.metaDescription", group: "Uses", label: "Search result description", def: "The tools and setup I use day to day.", long: true },
  { key: "uses.intro", group: "Uses", label: "Intro paragraph", def: "The tools I reach for daily. This page changes whenever I switch something out.", long: true },
  { key: "uses.otherGroup", group: "Uses", label: "Heading for items with no group", def: "Other" },

  // ── Contact page ────────────────────────────────────────────────────
  { key: "contact.title", group: "Contact", label: "Page title and headline", def: "Contact" },
  { key: "contact.metaDescription", group: "Contact", label: "Search result description", def: "Get in touch with Md. Tariqul Islam, web developer in Savar, Dhaka, Bangladesh.", long: true },
  { key: "contact.intro", group: "Contact", label: "Intro paragraph", def: "Have a project, a role, or just a question? Write to me. I read every message and reply within a day.", long: true },
  { key: "contact.directHeading", group: "Contact", label: "\"Direct\" heading", def: "Direct" },
  { key: "contact.githubLabel", group: "Contact", label: "GitHub link text", def: "github.com/MeTariqul" },
  { key: "contact.timezoneNote", group: "Contact", label: "Time zone note", def: "Based in Savar, Dhaka, Bangladesh. I am comfortable working across time zones.", long: true },
  { key: "contact.nameLabel", group: "Contact", label: "Name field label", def: "Your name" },
  { key: "contact.emailLabel", group: "Contact", label: "Email field label", def: "Email" },
  { key: "contact.messageLabel", group: "Contact", label: "Message field label", def: "Message" },
  { key: "contact.send", group: "Contact", label: "Send button", def: "Send message" },
  { key: "contact.sending", group: "Contact", label: "Send button while sending", def: "Sending…" },
  { key: "contact.sentHeading", group: "Contact", label: "Confirmation heading", def: "Message sent" },
  { key: "contact.sentOk", group: "Contact", label: "Confirmation message", def: "Thanks! Your message is in my inbox. I will reply within a day.", long: true },
  { key: "contact.sentBot", group: "Contact", label: "Confirmation shown to bots", def: "Thanks! Your message is on its way.", long: true, help: "Only bots see this. Real messages get the confirmation above." },
  { key: "contact.errFix", group: "Contact", label: "Error: fields need fixing", def: "Please fix the fields below.", long: true },
  { key: "contact.errRate", group: "Contact", label: "Error: too many messages", def: "You have sent a few messages already. Give it a few minutes.", long: true },
  { key: "contact.errSave", group: "Contact", label: "Error: could not save", def: "I could not save your message. Please try again or email me.", long: true },
  { key: "contact.errName", group: "Contact", label: "Error: name invalid", def: "Please tell me your name.", long: true },
  { key: "contact.errEmail", group: "Contact", label: "Error: email invalid", def: "Please enter a valid email address.", long: true },
  { key: "contact.errMessage", group: "Contact", label: "Error: message too short", def: "Write at least a few words so I can help.", long: true },

  // ── Site-wide ───────────────────────────────────────────────────────
  { key: "ui.all", group: "Site-wide", label: "\"All\" filter chip", def: "All" },
  { key: "ui.github", group: "Site-wide", label: "\"GitHub\" label", def: "GitHub" },
  { key: "ui.linkedin", group: "Site-wide", label: "\"LinkedIn\" label", def: "LinkedIn" },
  { key: "ui.portraitAlt", group: "Site-wide", label: "Portrait photo description", def: "Portrait of Md. Tariqul Islam" },
  { key: "cta.startProject", group: "Site-wide", label: "\"Start a project\" button", def: "Start a project" },
  { key: "code.copy", group: "Site-wide", label: "Code block copy button", def: "Copy" },
  { key: "code.copied", group: "Site-wide", label: "Code block copy button after copying", def: "Copied" },

  // ── Error pages ─────────────────────────────────────────────────────
  { key: "notFound.title", group: "Error pages", label: "404 page title", def: "Page not found" },
  { key: "notFound.label", group: "Error pages", label: "404 label", def: "404" },
  { key: "notFound.heading", group: "Error pages", label: "404 headline", def: "This page doesn't exist." },
  { key: "notFound.body", group: "Error pages", label: "404 paragraph", def: "Maybe the link is old, or I moved something and forgot to leave a note. The homepage is a good place to start again.", long: true },
  { key: "notFound.back", group: "Error pages", label: "\"Back to the homepage\" link", def: "Back to the homepage" },

  // ── Search and RSS ──────────────────────────────────────────────────
  { key: "seo.home.title", group: "Search and RSS", label: "Home page title in search results", def: "Md. Tariqul Islam · Web developer", help: "Other pages add \"· Md. Tariqul Islam\" automatically." },
  { key: "seo.home.description", group: "Search and RSS", label: "Default description in search results", def: "Portfolio and blog of Md. Tariqul Islam, a web developer from Savar, Dhaka, Bangladesh.", long: true },
  { key: "rss.description", group: "Search and RSS", label: "RSS feed description", def: "Notes on web development, Python and AI by Md. Tariqul Islam.", long: true },
] as const satisfies readonly CopyFieldInfo[];

export type CopyKey = (typeof COPY_FIELDS)[number]["key"];

// Every key's default, for merging with the database overrides.
export const copyDefaults = Object.fromEntries(
  COPY_FIELDS.map((f) => [f.key, f.def]),
) as Record<CopyKey, string>;

// Groups in catalogue order, for the admin screen.
export const COPY_GROUPS: string[] = Array.from(
  new Set(COPY_FIELDS.map((f) => f.group)),
);

// The full copy map a page renders from.
export type Copy = Record<CopyKey, string>;
