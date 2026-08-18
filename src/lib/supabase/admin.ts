import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [300, 900];
const RETRYABLE_BODY = /JWT issued at future|clock skew|issued at/i;

async function retryingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const hasBody = !!init?.body || (input instanceof Request && input.body !== null);
  let lastStatus = 0;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(input, init);
    } catch (e) {
      if (hasBody) throw e;
      lastError = e;
    }
    if (res) {
      const body = await res.text().catch(() => "");
      const retryable =
        !hasBody &&
        (res.status >= 500 || RETRYABLE_BODY.test(body));
      if (!retryable || attempt === MAX_ATTEMPTS - 1) {
        return new Response(body, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      }
      lastStatus = res.status;
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt] ?? 900));
    }
  }
  if (lastError) throw lastError;
  throw new Error(`Supabase request failed after ${MAX_ATTEMPTS} attempts (status ${lastStatus})`);
}

export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[supabase/admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: retryingFetch },
  });
}