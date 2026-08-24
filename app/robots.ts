import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/reset-password", "/verify-email"]
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString()
  };
}
