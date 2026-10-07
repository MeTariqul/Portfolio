// Supabase Storage helpers, shared by the media library and post
// attachments. Plain fetch instead of the supabase-js SDK: two endpoints
// are all we need (object upload/delete and bucket creation).

export const BUCKET = "portfolio-media";

export type StorageConfig = { url: string; key: string };

export function supabaseStorage(): StorageConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

// Storage only authenticates requests that carry BOTH headers: the token
// in Authorization and the same token as apikey (supabase-js always sends
// the pair; with only Authorization it answers "Invalid Compact JWS").
export function authHeaders(storage: StorageConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${storage.key}`,
    apikey: storage.key,
  };
}

// Creates the public bucket on first use. 409 = it already exists.
export async function ensureBucket(storage: StorageConfig): Promise<void> {
  try {
    const res = await fetch(`${storage.url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        ...authHeaders(storage),
        "Content-Type": "application/json",
      },
      // `name` is required by the storage API alongside `id`.
      body: JSON.stringify({ id: BUCKET, name: "Portfolio media", public: true }),
    });
    // Supabase returns HTTP 400 carrying `"statusCode":"409"` in the body
    // for an existing bucket, so both the status and the body are checked.
    if (res.ok) return;
    const detail = await res.text();
    if (res.status === 409 || detail.includes('"BucketAlreadyExists"')) return;
    console.warn("Bucket create failed:", res.status, detail);
  } catch (err) {
    console.warn("Bucket create error:", err);
  }
}

// Turns a storage path into its public URL.
export function publicUrl(storage: StorageConfig, path: string): string {
  return `${storage.url}/storage/v1/object/public/${BUCKET}/${path}`;
}

// Extracts the storage path from a public URL of our bucket, or null when
// the URL points somewhere else.
export function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length);
  return path.length > 0 ? decodeURIComponent(path) : null;
}

// Asks Supabase for a short-lived, unauthenticated upload URL for `path`.
// The browser PUTs the file straight to storage, so large files never
// pass through the server (Vercel caps request bodies at ~4.5 MB).
// The URL segment is `bucket/path`; the reply comes back relative to
// `/storage/v1` (e.g. "/object/upload/sign/bucket/file?token=…").
export async function signUpload(
  storage: StorageConfig,
  path: string,
): Promise<{ uploadUrl: string } | { error: string }> {
  try {
    const base = `${storage.url}/storage/v1`;
    const res = await fetch(
      `${base}/object/upload/sign/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          ...authHeaders(storage),
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );
    if (!res.ok) {
      console.warn("Sign upload failed:", res.status, await res.text());
      return { error: `Storage refused the upload (${res.status}).` };
    }
    const data = (await res.json().catch(() => null)) as {
      url?: string;
      signedURL?: string;
    } | null;
    // Current storage-js reads `data.url`; older versions returned `signedURL`.
    const signedPath = data?.url ?? data?.signedURL;
    if (!signedPath) return { error: "Storage returned no upload URL." };
    const prefix = signedPath.startsWith("/storage/v1")
      ? storage.url
      : base;
    return { uploadUrl: `${prefix}${signedPath}` };
  } catch (err) {
    console.warn("Sign upload error:", err);
    return { error: "Could not reach storage. Try again." };
  }
}

// Best-effort delete of one object; returns whether it succeeded.
export async function deleteObject(
  storage: StorageConfig,
  path: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${storage.url}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "DELETE",
        headers: authHeaders(storage),
      },
    );
    return res.ok;
  } catch (err) {
    console.warn("Storage delete error:", err);
    return false;
  }
}

// Deletes the object behind a public URL of our bucket (used when an
// attachment or media row is removed).
export async function deleteObjectByUrl(url: string): Promise<boolean> {
  const storage = supabaseStorage();
  const path = storagePathFromUrl(url);
  if (!storage || !path) return false;
  return deleteObject(storage, path);
}
