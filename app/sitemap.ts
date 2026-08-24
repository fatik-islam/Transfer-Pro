import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppUrl();
  const paths = ["/", "/book", "/fleet", "/routes", "/about", "/contact"];

  return paths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/book" ? 0.9 : 0.7
  }));
}
