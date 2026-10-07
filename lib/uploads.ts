// Shared rules for post attachments (photos, videos, documents).
// Used by the admin editor (early, friendly errors) and by the server
// action (authoritative re-check before anything is signed or stored).

export type AttachmentKind = "IMAGE" | "VIDEO" | "FILE";

export const UPLOAD_LIMITS: Record<AttachmentKind, number> = {
  IMAGE: 8 * 1024 * 1024, // 8 MB
  VIDEO: 30 * 1024 * 1024, // 30 MB
  FILE: 20 * 1024 * 1024, // 20 MB
};

const MIME_KINDS: Record<string, AttachmentKind> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "image/gif": "IMAGE",
  "image/avif": "IMAGE",
  "image/svg+xml": "IMAGE",
  "video/mp4": "VIDEO",
  "video/webm": "VIDEO",
  "video/ogg": "VIDEO",
  "video/quicktime": "VIDEO",
  "application/pdf": "FILE",
  "text/plain": "FILE",
  "text/markdown": "FILE",
  "text/csv": "FILE",
  "application/zip": "FILE",
  "application/x-zip-compressed": "FILE",
  "application/msword": "FILE",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "FILE",
  "application/vnd.ms-excel": "FILE",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "FILE",
  "application/vnd.ms-powerpoint": "FILE",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "FILE",
};

const EXT_KINDS: Record<string, AttachmentKind> = {
  jpg: "IMAGE",
  jpeg: "IMAGE",
  png: "IMAGE",
  webp: "IMAGE",
  gif: "IMAGE",
  avif: "IMAGE",
  svg: "IMAGE",
  mp4: "VIDEO",
  webm: "VIDEO",
  ogv: "VIDEO",
  mov: "VIDEO",
  m4v: "VIDEO",
  pdf: "FILE",
  txt: "FILE",
  md: "FILE",
  csv: "FILE",
  zip: "FILE",
  doc: "FILE",
  docx: "FILE",
  xls: "FILE",
  xlsx: "FILE",
  ppt: "FILE",
  pptx: "FILE",
};

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : "";
}

// Classifies a file by MIME type, falling back to the extension because
// some files (archives, markdown) arrive with an empty type.
export function classifyUpload(contentType: string, filename: string): AttachmentKind | null {
  const byMime = MIME_KINDS[contentType.toLowerCase().split(";")[0].trim()];
  if (byMime) return byMime;
  return EXT_KINDS[fileExtension(filename)] ?? null;
}

export function kindLabel(kind: AttachmentKind): string {
  return kind === "IMAGE" ? "Photo" : kind === "VIDEO" ? "Video" : "Document";
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
