import { Suspense } from "react";
import ResetPasswordContent from "./content";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center px-6">
          <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-nebula border-t-transparent" />
            <p className="mt-4 font-mono text-xs text-soft">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
