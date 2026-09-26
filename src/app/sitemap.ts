import type { MetadataRoute } from "next";
import {
  getSite,
  getBlogPosts,
  getCrazyTimePosts,
  getAllProjects,
  projectSlug,
} from "@/lib/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSite();
  const [dbPosts, dbCrazyPosts, dbProjects] = await Promise.all([
    getBlogPosts(),
    getCrazyTimePosts(),
    getAllProjects(),
  ]);

  const homepage = {
    url: s.url,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 1,
  };

  const aboutPage = {
    url: `${s.url}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  };

  const blogIndex = {
    url: `${s.url}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  };

  const projectsIndex = {
    url: `${s.url}/projects`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  };

  const crazyTimeIndex = {
    url: `${s.url}/crazy-time`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  };

  const blogPosts =
    dbPosts?.map((post) => ({
      url: `${s.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) ?? [];

  const crazyTimePosts =
    dbCrazyPosts?.map((post) => ({
      url: `${s.url}/crazy-time/${post.id}`,
      lastModified: new Date(post.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })) ?? [];

  const projectPages = dbProjects.map((project) => ({
    url: `${s.url}/projects/${projectSlug(project.title)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    homepage,
    aboutPage,
    blogIndex,
    projectsIndex,
    crazyTimeIndex,
    ...blogPosts,
    ...projectPages,
    ...crazyTimePosts,
  ];
}