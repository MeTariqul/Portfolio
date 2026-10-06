import type { Metadata } from "next";
import { getSettings } from "@/lib/content";
import {
  SiteSettingsForm,
  ChangePasswordForm,
} from "@/components/admin/settings-forms";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const settings = await getSettings();

  const banner =
    saved === "site"
      ? "Settings saved. The site updates within a minute."
      : saved === "password"
        ? "Password changed."
        : null;

  return (
    <div className="max-w-[760px]">
      <h1 className="text-3xl">Settings</h1>

      {banner && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm"
        >
          {banner}
        </p>
      )}

      <section className="mt-8" aria-labelledby="site-heading">
        <h2 id="site-heading" className="text-xl">
          Site content
        </h2>
        <p className="mt-1 mb-6 text-sm text-soft">
          The availability note, home headline and about story.
        </p>
        <SiteSettingsForm
          initial={{
            available: settings.availability.available,
            availabilityNote: settings.availability.note,
            homeRole: settings.home.role,
            homeIntro: settings.home.intro,
            aboutStory: settings.about.story.join("\n\n"),
            aboutInterests: settings.about.interests.join("\n"),
          }}
        />
      </section>

      <section
        className="mt-12 border-t border-line pt-10"
        aria-labelledby="password-heading"
      >
        <h2 id="password-heading" className="text-xl">
          Change password
        </h2>
        <p className="mt-1 mb-6 text-sm text-soft">
          At least 10 characters. You stay signed in.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
