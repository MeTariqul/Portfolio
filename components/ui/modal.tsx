"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Accessible modal built on the native <dialog> element:
// focus trap, Escape-to-close and backdrop come from the platform.
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (e.target === ref.current) ref.current.close();
      }}
      className={cn(
        "m-auto w-full max-w-lg rounded-xl border border-line bg-surface p-0 backdrop:bg-black/40",
        className,
      )}
    >
      <div className="p-6">
        <h2 className="mb-4 text-xl">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
