import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://astra-ai-martinslad10.vercel.app").replace(/\/$/, "");
  const routes = ["/", "/account", "/memory", "/code", "/marketing", "/images", "/video"];
  return routes.map(route => ({
    url: siteUrl + route,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.6,
  }));
}
