import type { Metadata } from "next";

import { brand } from "@/lib/site-data";
import { getAppUrl } from "@/lib/app-config";

interface MetadataInput {
  title: string;
  description: string;
  path?: string;
}

export function buildMetadata({ title, description, path = "/" }: MetadataInput): Metadata {
  const url = new URL(path, getAppUrl());

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
