export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string };

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  category: string;
  featured?: boolean;
  gradient: string;
  blocks: BlogBlock[];
};

export const posts: Post[] = [
  {
    slug: "ai-study-platform-case-study",
    title: "Building an AI-Powered Study Platform from Scratch",
    description:
      "Documents, OCR, flashcards, an AI tutor, free-vs-pro billing — how I architected a full study OS on a student budget.",
    date: "2026-06-18",
    readTime: 9,
    category: "Case Study",
    featured: true,
    gradient: "from-violet-600 via-fuchsia-500 to-cyan-400",
    blocks: [
      {
        type: "p",
        text: "Every student knows the feeling: 40 PDFs of lecture slides, zero time to read them, and an exam next week. That's the problem I set out to kill. I designed a platform where you upload course documents — PDF, DOCX, PPTX, even scanned papers — and the system turns them into a personal study engine: flashcards, quizzes, summaries and an AI tutor that knows your material.",
      },
      {
        type: "h2",
        text: "The architecture",
      },
      {
        type: "p",
        text: "Next.js 15 App Router on the front, API routes as a monolith backend, PostgreSQL (Neon) + Prisma for data, Upstash Redis for rate limiting and queues, and Vercel Blob for document storage. The secret sauce was the pipeline: file upload → text extraction → OCR when needed → chunking → embedding + LLM calls, all processed in background jobs so the UI never blocks.",
      },
      {
        type: "code",
        lang: "ts",
        code: `// Pipeline sketch: document → study material
export async function processDocument(file: File) {
  const text = file.type === 'application/pdf'
    ? await extractPdf(file)      // pdf-parse + OCR fallback
    : await extractOffice(file);  // DOCX / PPTX / TXT

  const chunks = chunk(text, 800);
  const embeddings = await embed(chunks);   // OpenAI
  await upsertVectors(chunks, embeddings);  // pgvector

  return enqueueSummaryJob(chunks);
}`,
      },
      {
        type: "h2",
        text: "OCR was the hardest 20%",
      },
      {
        type: "p",
        text: "Scanned Bengali lecture sheets are brutal for OCR engines. I ended up with a cascade: try the PDF's embedded text layer first, fall back to Tesseract, then to a vision LLM for low-confidence pages. Accuracy jumped from ~70% to 95%+, and free-tier users get the cheap path while Pro gets the smart path.",
      },
      {
        type: "h2",
        text: "Free vs Pro, done right",
      },
      {
        type: "list",
        items: [
          "Free: 5 documents, 50 AI questions/day, flashcards only",
          "Pro: unlimited documents, AI tutor sessions, OCR priority",
          "Stripe checkout, JWT sessions, email verification on signup",
        ],
      },
      {
        type: "p",
        text: "The lesson? Real products win on the boring parts — queues, retries, cost limits — not the flashy UI. That's what separates a demo from something people actually use.",
      },
    ],
  },
  {
    slug: "shipping-ai-on-vercel-free-tier",
    title: "Shipping AI Apps on Vercel's Free Tier Without Going Broke",
    description:
      "The exact cost-optimization playbook: caching, queueing, model routing and edge tricks that keep an AI app at $0/mo.",
    date: "2026-04-02",
    readTime: 7,
    category: "Engineering",
    gradient: "from-cyan-400 via-blue-500 to-violet-600",
    blocks: [
      {
        type: "p",
        text: "Everyone's first AI app is a money pit waiting to happen. Here's the exact system I use to keep AI-heavy apps running on Vercel's free tier — zero server bills, single-digit API costs.",
      },
      {
        type: "h2",
        text: "Rule 1: Cache like your budget depends on it",
      },
      {
        type: "p",
        text: "The same question asked twice costs twice. I hash the input (document ID + query) and check Redis before touching an LLM. For study-platform flashcards, ~40% of generation requests are duplicates. That's 40% of API spend deleted.",
      },
      {
        type: "code",
        lang: "ts",
        code: `const key = \`gen:\${sha1(input)}\`;
const cached = await redis.get(key);
if (cached) return cached;              // hit: $0.00

const result = await cheapestModel(input);
await redis.set(key, result, { ex: 86400 });`,
      },
      {
        type: "h2",
        text: "Rule 2: Route to the cheapest model that works",
      },
      {
        type: "list",
        items: [
          "Summaries → small fast models (Gemini Flash)",
          "Reasoning-heavy tutoring → a capable mid-tier model",
          "Batch jobs → the model with best cost/token that day",
          "Always set maxTokens — runaway generation is how bills explode",
        ],
      },
      {
        type: "h2",
        text: "Rule 3: Background, not request-time",
      },
      {
        type: "p",
        text: "Long generations belong in background jobs with webhooks, not inside a serverless function you pay for per millisecond. A queue (Redis + a tiny worker) means users see a spinner for 2 seconds and you pay for the absolute minimum compute.",
      },
      {
        type: "p",
        text: "The whole app runs at roughly $0 infra + ~$5/month in API calls. The day it starts getting real traffic, everything scales horizontally without redesign — because the boring parts were done right from day one.",
      },
    ],
  },
  {
    slug: "r3f-cinematic-heroes",
    title: "Crafting Cinematic 3D Heroes with React Three Fiber",
    description:
      "Distorted geometry, instanced starfields, bloom postprocessing — the recipe for a hero section that makes people stop scrolling.",
    date: "2026-02-11",
    readTime: 6,
    category: "Design & Motion",
    gradient: "from-fuchsia-500 via-rose-500 to-amber-400",
    blocks: [
      {
        type: "p",
        text: "This very site you're reading has a WebGL hero. Here's how it's built, and the performance rules that keep it at 60fps on a mid-range laptop.",
      },
      {
        type: "h2",
        text: "The recipe",
      },
      {
        type: "list",
        items: [
          "An icosahedron with a distort material as the energy core",
          "A wireframe shell that counter-rotates for depth",
          "Instanced starfield from drei's <Stars>",
          "Floating glass shards orbiting on their own clocks",
          "Bloom + vignette postprocessing for the glow",
          "Mouse parallax on the camera, not the objects",
        ],
      },
      {
        type: "code",
        lang: "tsx",
        code: `<Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
  <Stars radius={60} depth={40} count={4000} factor={3} fade />
  <EnergyCore />
  <OrbitingShards />
  <EffectComposer>
    <Bloom intensity={0.9} luminanceThreshold={0.2} />
    <Vignette eskil={false} offset={0.25} darkness={0.75} />
  </EffectComposer>
</Canvas>`,
      },
      {
        type: "h2",
        text: "The performance commandments",
      },
      {
        type: "p",
        text: "Cap DPR at 1.5. Pause the render loop when the hero scrolls out of view (IntersectionObserver + frameloop). Use instancing for anything repeated. Never animate CSS layout properties alongside WebGL — keep transforms and opacity only. And always ship a CSS fallback: no WebGL, no problem.",
      },
      {
        type: "p",
        text: "A 3D hero isn't decoration — it's the first sentence of your portfolio. Make it say something about how you think.",
      },
    ],
  },
  {
    slug: "python-ai-pipeline-sidekick",
    title: "Why Python Is My AI Pipeline Sidekick",
    description:
      "OCR, scraping, data wrangling and model glue — the Python layer that powers the AI features in my Next.js products.",
    date: "2026-07-28",
    readTime: 6,
    category: "Python",
    gradient: "from-emerald-500 via-teal-500 to-cyan-400",
    blocks: [
      {
        type: "p",
        text: "React and Next.js handle the user-facing side of everything I build, but a lot of the magic happens off-screen in Python. Every AI feature I've shipped — OCR fallbacks, document pipelines, scrapers, smart search — has a Python layer underneath. This post is about where Python earns its keep in a JavaScript-first stack.",
      },
      {
        type: "h2",
        text: "The division of labor",
      },
      {
        type: "list",
        items: [
          "Next.js: UI, routing, auth, billing, server actions",
          "Python: OCR, PDF/DOCX extraction, scraping, data cleaning, ML models",
          "Bridge: FastAPI microservices + background jobs — never blocking the UI",
        ],
      },
      {
        type: "code",
        lang: "python",
        code: `# OCR fallback cascade: cheap → smart
def extract_text(path: Path) -> str:
    text = try_pdf_text_layer(path)
    if low_confidence(text):
        text = tesseract_ocr(path)          # free tier
    if low_confidence(text):
        text = vision_llm(path)             # pro tier
    return clean(text)

def clean(text: str) -> str:
    return " ".join(text.split())  # pandas-free, regex-lite`,
      },
      {
        type: "h2",
        text: "Scraping that doesn't break",
      },
      {
        type: "p",
        text: "Selenium for anything JavaScript-rendered, BeautifulSoup for static pages, and pandas for the messy aftermath. The rule: every scraper is a pipeline — fetch, parse, normalize, validate — with retries and a schema, so the data out the other end is always clean enough to feed a LangChain pipeline or a PostgreSQL table.",
      },
      {
        type: "h2",
        text: "When NOT to use Python",
      },
      {
        type: "p",
        text: "If it fits in a 10-line Node script, don't add a service boundary. Python earns its place for heavy compute, ML, and ecosystems (LangChain, scikit-learn) where JavaScript is second-class. Everything else stays in the Next.js app — one deploy, one language, fewer moving parts.",
      },
      {
        type: "p",
        text: "The takeaway: a full-stack developer who can step between TypeScript and Python can ship features — OCR, automation, model glue — that most web devs have to outsource.",
      },
    ],
  },
];
