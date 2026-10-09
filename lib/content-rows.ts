import { prisma } from "@/lib/prisma";
import type { ContentSpec } from "@/lib/content-specs";

// Server-side row access for the generic content screens. One switch per
// operation keeps every prisma call fully typed (a dynamic prisma[model]
// lookup would not be). Import only from server files: this module pulls
// in the prisma client.

export type ContentRow = { id: string; [key: string]: unknown };

type RowData = Record<string, string | number | null>;

export async function listRows(spec: ContentSpec): Promise<ContentRow[]> {
  let rows: unknown;
  switch (spec.kind) {
    case "services":
      rows = await prisma.service.findMany({ orderBy: { order: "asc" } });
      break;
    case "experience":
      rows = await prisma.experience.findMany({ orderBy: { order: "asc" } });
      break;
    case "skills":
      rows = await prisma.skill.findMany({ orderBy: { order: "asc" } });
      break;
    case "uses":
      rows = await prisma.usesItem.findMany({ orderBy: { order: "asc" } });
      break;
  }
  return rows as ContentRow[];
}

export async function getRow(
  spec: ContentSpec,
  id: string,
): Promise<ContentRow | null> {
  let row: unknown;
  switch (spec.kind) {
    case "services":
      row = await prisma.service.findUnique({ where: { id } });
      break;
    case "experience":
      row = await prisma.experience.findUnique({ where: { id } });
      break;
    case "skills":
      row = await prisma.skill.findUnique({ where: { id } });
      break;
    case "uses":
      row = await prisma.usesItem.findUnique({ where: { id } });
      break;
  }
  return row as ContentRow | null;
}

export async function upsertRow(
  spec: ContentSpec,
  id: string | null,
  data: RowData,
): Promise<void> {
  switch (spec.kind) {
    case "services": {
      const row = {
        title: String(data.title),
        descriptionMD: String(data.descriptionMD),
        priceNote: data.priceNote ? String(data.priceNote) : null,
        order: Number(data.order),
      };
      if (id) await prisma.service.update({ where: { id }, data: row });
      else await prisma.service.create({ data: row });
      break;
    }
    case "experience": {
      const row = {
        kind: data.kind as "EDUCATION" | "FREELANCE" | "WORK",
        title: String(data.title),
        org: String(data.org),
        period: String(data.period),
        description: String(data.description),
        order: Number(data.order),
      };
      if (id) await prisma.experience.update({ where: { id }, data: row });
      else await prisma.experience.create({ data: row });
      break;
    }
    case "skills": {
      const row = {
        name: String(data.name),
        group: String(data.group),
        order: Number(data.order),
      };
      if (id) await prisma.skill.update({ where: { id }, data: row });
      else await prisma.skill.create({ data: row });
      break;
    }
    case "uses": {
      const row = {
        title: String(data.title),
        description: String(data.description),
        group: data.group ? String(data.group) : null,
        order: Number(data.order),
      };
      if (id) await prisma.usesItem.update({ where: { id }, data: row });
      else await prisma.usesItem.create({ data: row });
      break;
    }
  }
}

export async function deleteRow(spec: ContentSpec, id: string): Promise<void> {
  switch (spec.kind) {
    case "services":
      await prisma.service.delete({ where: { id } });
      break;
    case "experience":
      await prisma.experience.delete({ where: { id } });
      break;
    case "skills":
      await prisma.skill.delete({ where: { id } });
      break;
    case "uses":
      await prisma.usesItem.delete({ where: { id } });
      break;
  }
}
