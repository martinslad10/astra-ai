import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://chatsladai.vercel.app").replace(/\/$/, "");
  const routes = ["/", "/privacy", "/terms", "/account", "/memory", "/code", "/marketing", "/images", "/connections"];
  return routes.map(route => ({
    url: siteUrl + route,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.6,
  }));
}
