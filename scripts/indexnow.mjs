// Tells IndexNow (Bing, Yandex, Seznam, Naver) that URLs changed, so they
// recrawl in minutes instead of waiting for the next organic pass. Google does
// not use IndexNow; it has Search Console and the sitemap instead.
//
// The key is the name of the file in public/, and that file has to be reachable
// at https://<host>/<key>.txt before the endpoint will accept anything. So this
// only works after a deploy that includes it.
//
//   npm run seo:ping                 -> every URL in the sitemap
//   npm run seo:ping -- /blog/x      -> just those paths or full URLs
import fs from "node:fs";
import path from "node:path";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://metariqul.vercel.app"
).replace(/\/$/, "");

const publicDir = path.join(process.cwd(), "public");
const keyFile = fs
  .readdirSync(publicDir)
  .find((name) => /^[a-f0-9]{32}\.txt$/.test(name));

if (!keyFile) {
  console.error("No IndexNow key file in public/ (expected <32 hex chars>.txt).");
  process.exit(1);
}
const key = keyFile.replace(/\.txt$/, "");
const keyLocation = `${SITE}/${keyFile}`;

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
let urls = args.map((a) => (a.startsWith("/") ? `${SITE}${a}` : a));

if (urls.length === 0) {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) {
    console.error(`Could not read the sitemap: HTTP ${res.status}`);
    process.exit(1);
  }
  const xml = await res.text();
  urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) {
    console.error("The sitemap listed no URLs.");
    process.exit(1);
  }
}

// The key file has to be live before the endpoint will trust us; checking here
// turns a confusing 403 into something readable.
const keyCheck = await fetch(keyLocation);
if (!keyCheck.ok) {
  console.error(
    `Key file is not reachable yet (${keyCheck.status}): ${keyLocation}\n` +
      `Deploy the site first, then run this again.`,
  );
  process.exit(1);
}

console.log(`Submitting ${urls.length} URL(s) as ${new URL(SITE).host}`);
for (const url of urls) console.log(`  ${url}`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE).host,
    key,
    keyLocation,
    urlList: urls,
  }),
});

// 200/202 mean accepted (202 = "received, keys still being validated").
// 403 = key file missing or the key does not match it.
// 422 = a URL does not belong to the host.
const meaning =
  res.status === 200 || res.status === 202
    ? "accepted"
    : res.status === 403
      ? "key rejected — is the key file live and byte-identical?"
      : res.status === 422
        ? "URL does not match the host"
        : res.status === 429
          ? "rate limited — try again later"
          : "unexpected";

console.log(`\nIndexNow: HTTP ${res.status} (${meaning})`);
const body = (await res.text()).trim();
if (body) console.log(body);

process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
