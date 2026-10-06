"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export type SettingsState = { error?: string };

const siteSchema = z.object({
  available: z.boolean(),
  availabilityNote: z.string().trim().min(3).max(200),
  homeRole: z.string().trim().min(3).max(200),
  homeIntro: z.string().trim().min(20).max(600),
  aboutStory: z.string().trim().min(40),
  aboutInterests: z.string().trim().min(3),
});

export async function saveSiteSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const parsed = siteSchema.safeParse({
    available: formData.get("available") === "on",
    availabilityNote: formData.get("availabilityNote"),
    homeRole: formData.get("homeRole"),
    homeIntro: formData.get("homeIntro"),
    aboutStory: formData.get("aboutStory"),
    aboutInterests: formData.get("aboutInterests"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const d = parsed.data;
  const story = d.aboutStory
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const interests = d.aboutInterests
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  await prisma.setting.upsert({
    where: { key: "availability" },
    create: {
      key: "availability",
      value: { available: d.available, note: d.availabilityNote },
    },
    update: { value: { available: d.available, note: d.availabilityNote } },
  });
  await prisma.setting.upsert({
    where: { key: "home" },
    create: { key: "home", value: { role: d.homeRole, intro: d.homeIntro } },
    update: { value: { role: d.homeRole, intro: d.homeIntro } },
  });
  await prisma.setting.upsert({
    where: { key: "about" },
    create: { key: "about", value: { story, interests } },
    update: { value: { story, interests } },
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=site");
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(10, "New password needs at least 10 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "New passwords do not match.",
    path: ["confirm"],
  });

export async function changePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/admin/login");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(parsed.data.current, user.passwordHash)) {
    return { error: "Current password is wrong." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.next) },
  });

  redirect("/admin/settings?saved=password");
}
