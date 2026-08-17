// Generates public/cv/Md-Tariqul-Islam-CV.pdf (single-page, Helvetica)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const lines = [
  { text: "MD. TARIQUL ISLAM", size: 24, bold: true, gap: 26 },
  { text: "Full-Stack Web Developer", size: 13, bold: false, gap: 6 },
  { text: "Savar, Dhaka, Bangladesh", size: 10, bold: false, gap: 4 },
  { text: "github.com/MeTariqul   |   linkedin.com/in/metariqul", size: 10, bold: false, gap: 18 },
  { text: "SUMMARY", size: 12, bold: true, gap: 6 },
  { text: "CSE student and full-stack developer who ships real products - AI-powered web apps, e-commerce and developer tools - built with Next.js, React, TypeScript, Node.js, PostgreSQL, Prisma and Redis.", size: 10, bold: false, gap: 14 },
  { text: "SKILLS", size: 12, bold: true, gap: 6 },
  { text: "Frontend: React, Next.js, TypeScript, Tailwind CSS, Three.js, Framer Motion", size: 10, bold: false, gap: 4 },
  { text: "Backend: Node.js, PostgreSQL, Prisma, Redis, REST APIs, JWT, WebSockets", size: 10, bold: false, gap: 4 },
  { text: "AI: OpenAI, Gemini, LangChain, OCR, PDF pipelines | Infra: Vercel, Cloudflare, GitHub", size: 10, bold: false, gap: 14 },
  { text: "EDUCATION", size: 12, bold: true, gap: 6 },
  { text: "B.Sc. in Computer Science & Engineering - Gono Bishwabidyalay (2023 - 2027)", size: 10, bold: false, gap: 4 },
  { text: "Higher Secondary (HSC) - Mirza Golam Hafiz College | Secondary (SSC) - Adarsha High School", size: 10, bold: false, gap: 14 },
  { text: "SELECTED PROJECTS", size: 12, bold: true, gap: 6 },
  { text: "CoverVerse - AI assignment cover generator: 500+ templates, live preview, PDF/image export, offline support.", size: 10, bold: false, gap: 4 },
  { text: "MeTariqul Tec Shop - E-commerce platform with custom cart, checkout flow and inventory management.", size: 10, bold: false, gap: 4 },
  { text: "AI Study Platform - Docs to flashcards/quizzes via OCR + LLMs, AI tutor, free-vs-pro billing.", size: 10, bold: false, gap: 4 },
  { text: "Cloudflare Tunnel Monitor - Real-time tunnel health dashboard with uptime alerts.", size: 10, bold: false, gap: 4 },
  { text: "IPTV Stream Checker - M3U playback with per-minute channel health checks and live viewer counts.", size: 10, bold: false, gap: 14 },
  { text: "LINKS", size: 12, bold: true, gap: 6 },
  { text: "GitHub: https://github.com/MeTariqul    LinkedIn: https://www.linkedin.com/in/metariqul", size: 10, bold: false, gap: 0 },
];

const regular = "F1";
const bold = "F2";

function contentStream() {
  let y = 780;
  let out = "";
  for (const line of lines) {
    const font = line.bold ? bold : regular;
    out += `BT /${font} ${line.size} Tf 55 ${y} Td (${esc(line.text)}) Tj ET\n`;
    y -= line.gap + line.size * 0.5;
  }
  return out;
}

const stream = contentStream();

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
  `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
];

let pdf = "%PDF-1.4\n";
const offsets = [];
for (let i = 0; i < objects.length; i++) {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}
const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const off of offsets) {
  pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "cv");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "Md-Tariqul-Islam-CV.pdf");
writeFileSync(outPath, pdf, "binary");
console.log("CV written to", outPath, `(${pdf.length} bytes)`);
