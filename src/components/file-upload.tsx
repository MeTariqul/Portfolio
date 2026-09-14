"use client";

import { useRef, useState } from "react";
import { Upload, X, Link as LinkIcon } from "lucide-react";
import { uploadCrazyTimeFile } from "@/app/actions/admin";

const labelClass =
  "mb-2 block font-mono text-xs uppercase tracking-widest text-soft";

type FileUploadProps = {
  label: string;
  accept?: string;
  currentFile?: string;
  currentUrl?: string;
  onUpload: (fileName: string, fileUrl: string) => void;
  onRemove: () => void;
};

export function FileUpload({
  label,
  accept = "image/*",
  currentFile = "",
  currentUrl = "",
  onUpload,
  onRemove,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"upload" | "link">(currentUrl ? "upload" : "upload");
  const [linkUrl, setLinkUrl] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Data = base64.split(",")[1];
      const res = await uploadCrazyTimeFile(file.name, base64Data, file.type);
      if (res.ok && res.url) {
        onUpload(file.name, res.url);
      } else {
        setError("Upload failed");
      }
    } catch {
      setError("Upload failed");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleLinkSubmit() {
    if (linkUrl.trim()) {
      const name = linkUrl.split("/").pop() || "link";
      onUpload(name, linkUrl.trim());
      setLinkUrl("");
    }
  }

  if (currentUrl) {
    return (
      <div>
        {label && <label className={labelClass}>{label}</label>}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          {accept === "image/*" && (
            <img
              src={currentUrl}
              alt={currentFile}
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-soft">{currentFile || currentUrl}</span>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-soft hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <label className={labelClass}>{label}</label>}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            mode === "upload" ? "bg-ink text-bg" : "text-soft hover:text-ink"
          }`}
        >
          <Upload size={12} />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            mode === "link" ? "bg-ink text-bg" : "text-soft hover:text-ink"
          }`}
        >
          <LinkIcon size={12} />
          Link
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface py-6 text-sm text-soft transition-colors hover:border-neon/40 hover:text-ink disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? "Uploading…" : "Click to upload"}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/file.pdf"
            className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-soft/50 focus:border-nebula/60"
          />
          <button
            type="button"
            onClick={handleLinkSubmit}
            disabled={!linkUrl.trim()}
            className="rounded-2xl bg-ink px-4 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
