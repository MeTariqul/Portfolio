// Identity and links. Static fallbacks only: the admin Settings screen
// overrides these at runtime from the `Setting` table.
export const site = {
  name: "Md. Tariqul Islam",
  shortName: "Tariqul",
  role: "Web developer",
  location: "Savar, Dhaka, Bangladesh",
  education: "B.Sc. in CSE at Gono Bishwabidyalay",
  github: "https://github.com/MeTariqul",
  linkedin: "https://www.linkedin.com/in/metariqul",
  email: process.env.CONTACT_EMAIL ?? "gbtarif37@gmail.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  cvPath: "/cv/Md-Tariqul-Islam-CV.pdf",
};
