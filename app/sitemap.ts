import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteConfig";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/companies`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/requests`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/add-request`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/regulamin`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const [{ data: companies }, { data: requests }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, created_at")
      .eq("status", "published")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false }),
    supabase
      .from("public_request_listings")
      .select("id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return [
    ...staticPages,
    ...(companies || []).map((company) => ({
      url: `${SITE_URL}/company/${company.id}`,
      lastModified: company.created_at ? new Date(company.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(requests || []).map((request) => ({
      url: `${SITE_URL}/request/${request.id}`,
      lastModified: request.created_at ? new Date(request.created_at) : undefined,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
