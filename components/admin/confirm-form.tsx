"use client";

// A form that asks for confirmation before running a server action
// (server components cannot pass event handlers, hence this wrapper).
export function ConfirmForm({
  action,
  confirmText,
  children,
}: {
  action: () => Promise<void> | void;
  confirmText: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
