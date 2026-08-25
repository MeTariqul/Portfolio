const WEBSITE_CONTEXT = `
ABOUT MD. TARIQUL ISLAM:
- Full-stack web developer from Savar, Dhaka, Bangladesh
- B.Sc. in CSE @ Gono Bishwabidyalay (2023-2027)
- 2+ years freelancing, 15+ public projects, 32+ technologies

CORE EXPERTISE:
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Three.js, shadcn/ui
- Backend: Node.js, PostgreSQL, Prisma, Redis, REST APIs, JWT Auth
- AI/ML: OpenAI, Gemini, LangChain, RAG, Prompt Engineering, OCR, PDF Processing
- Python: FastAPI, Django, pandas, NumPy, Selenium, BeautifulSoup, scikit-learn
- DevOps: Vercel, Cloudflare, Git, CI/CD

NOTABLE PROJECTS:
- CoverVerse: AI-powered assignment cover generator (500+ templates, live preview, PDF export)
- MeTariqul Tec Shop: Full-featured e-commerce platform (PostgreSQL, Prisma)
- AI Study Platform: Upload docs, OCR, flashcards, quizzes, AI tutor (OpenAI, Gemini, LangChain)
- Portfolio: Cinematic dark-mode portfolio with 3D scenes (Three.js, R3F)

SERVICES OFFERED:
- Full-stack web application development (Next.js/React + Node.js/Python)
- AI/ML integration and automation
- E-commerce solutions
- SaaS product development
- API development and integration
- Performance optimization
- Technical consulting

AVAILABILITY: Open to freelance projects, full-time positions, collaborations, and consulting.
`;

const CONFIRM_SYSTEM_PROMPT = `You are Md. Tariqul Islam's AI assistant for his portfolio website. Your task is to generate a brief, warm confirmation email when someone submits a contact form.

IMPORTANT RULES:
- Output ONLY the email content. No thinking, no analysis, no chain-of-thought.
- Start directly with the greeting.
- Keep it under 100 words.
- Be warm but concise.
- Mention 1-2 relevant skills if the message relates to development.
- End with a brief call to action.

TONE: Professional, friendly, genuine. No emojis. No markdown. Plain text only.

${WEBSITE_CONTEXT}`;

const AUTO_REPLY_SYSTEM_PROMPT = `You are Samba (Manager), Md. Tariqul Islam's email assistant. You manage his portfolio inquiries and generate professional, personalized email replies.

IMPORTANT RULES:
- Output ONLY the email reply. No thinking, no analysis, no chain-of-thought, no internal notes.
- Start directly with the greeting (e.g. "Hi [Name],").
- End with the signature block.
- Keep the reply between 100-180 words.
- Be warm, professional, and genuine.
- Reference specific skills or services relevant to the user's message.

MESSAGE TYPE GUIDELINES:
- Job opportunity: Express interest, mention relevant experience, suggest a call to discuss details.
- Project inquiry: Mention similar past work, ask for project requirements/budget/timeline.
- Collaboration: Show enthusiasm, ask about their vision, suggest how to combine strengths.
- General message: Acknowledge warmly, offer help, invite them to share more.

TONE: Professional, helpful, genuine. Like a real human manager would write. No emojis. No markdown. Plain text only.

${WEBSITE_CONTEXT}`;

export function stripThinkingContent(text: string): string {
  let cleaned = text;

  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, "").trim();
  cleaned = cleaned.replace(/\[\[thinking\]\][\s\S]*?\[\[\/thinking\]\]/gi, "").trim();
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "").trim();
  cleaned = cleaned.replace(/\{thinking\}[\s\S]*?\{\/thinking\}/gi, "").trim();

  const markers = [
    "Here's a thinking process:",
    "Here is a thinking process:",
    "Thinking process:",
    "Let me think about this:",
    "Let me analyze this:",
    "Analysis:",
    "Chain of thought:",
    "Reasoning:",
    "Step-by-step:",
    "Internal note:",
    "My approach:",
  ];
  for (const marker of markers) {
    const idx = cleaned.indexOf(marker);
    if (idx !== -1) {
      const afterMarker = cleaned.substring(idx);
      const blankLineIdx = afterMarker.search(/\n\s*\n/);
      if (blankLineIdx !== -1) {
        cleaned = cleaned.substring(idx + blankLineIdx).trim();
      } else {
        cleaned = cleaned.substring(0, idx).trim();
      }
    }
  }

  cleaned = cleaned.replace(/^\n+/, "").trim();
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}

export async function generateWithRetry(
  systemPrompt: string,
  userMessage: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    retries?: number;
  } = {}
): Promise<string> {
  const {
    maxTokens = 1024,
    temperature = 0.7,
    topP = 0.9,
    frequencyPenalty = 0.3,
    presencePenalty = 0.2,
    retries = 2,
  } = options;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  const { default: Groq } = await import("groq-sdk");
  const groq = new Groq({ apiKey });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      });

      let reply = result.choices[0]?.message?.content || "";
      reply = stripThinkingContent(reply);

      if (reply.length > 20) {
        return reply;
      }

      lastError = new Error("Response too short after stripping");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[AI] Attempt ${attempt + 1}/${retries + 1} failed:`, lastError.message);

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  console.error("[AI] All attempts failed:", lastError?.message);
  return "";
}

export async function generateConfirmEmail(
  userName: string,
  userMessage: string
): Promise<string> {
  return generateWithRetry(
    CONFIRM_SYSTEM_PROMPT,
    `User's name: ${userName}\n\nUser's message: ${userMessage}`,
    { maxTokens: 1024, temperature: 0.7 }
  );
}

export async function generateAutoReply(
  userName: string,
  userMessage: string
): Promise<string> {
  return generateWithRetry(
    AUTO_REPLY_SYSTEM_PROMPT,
    `Generate a reply to this message:\n\nFrom: ${userName}\nMessage: ${userMessage}`,
    { maxTokens: 1024, temperature: 0.7, topP: 0.85 }
  );
}

export async function generateAdminReply(
  userName: string,
  userMessage: string
): Promise<string> {
  return generateWithRetry(
    AUTO_REPLY_SYSTEM_PROMPT,
    `Generate a reply to this message:\n\nFrom: ${userName}\nMessage: ${userMessage}`,
    { maxTokens: 1024, temperature: 0.65, topP: 0.85 }
  );
}
