import type { Metadata } from "next";
import { PostForm } from "@/components/admin/post-form";

export const metadata: Metadata = {
  title: "New post",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <div className="max-w-[860px]">
      <h1 className="text-3xl">New post</h1>
      <p className="mt-2 mb-8 text-soft">
        Write it, save it as a draft, publish when ready.
      </p>
      <PostForm />
    </div>
  );
}
