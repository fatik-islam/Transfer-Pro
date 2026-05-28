import type { Metadata } from "next";

import { brand } from "@/lib/site-data";

interface MetadataInput {
  title: string;
  description: string;
  path?: string;
}

export function buildMetadata({ title, description, path = "/" }: MetadataInput): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL(path, baseUrl);

  return {
    title,
    description,
    alternates: {
      canonical: url.toString()
    },
    openGraph: {
      title,
      description,
      siteName: brand.name,
      url: url.toString(),
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}
