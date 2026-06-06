import {
  fetchServiceStatus,
  fetchServiceStatusFromAtom,
  type ServiceStatus,
} from "@/lib/status";

export const CLOUD_CANONICAL_SLUGS = ["aws", "google-cloud", "azure"] as const;
export type CloudCanonicalSlug = (typeof CLOUD_CANONICAL_SLUGS)[number];

const CLOUD_FEEDS: Record<
  CloudCanonicalSlug,
  { type: "rss" | "atom"; url: string }
> = {
  aws: {
    type: "rss",
    url: "https://status.aws.amazon.com/rss/all.rss",
  },
  "google-cloud": {
    type: "atom",
    url: "https://status.cloud.google.com/en/feed.atom",
  },
  azure: {
    type: "rss",
    url: "https://azure.status.microsoft/en-us/status/feed/",
  },
};

export type LiveCloudStatusRow = {
  service_slug: CloudCanonicalSlug;
  status: ServiceStatus;
  last_incident: string | null;
  last_incident_details: {
    title: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    components: string[];
  } | null;
  updated_at: string;
  source: "live-feed";
};

export async function fetchLiveCloudStatus(
  slugs: CloudCanonicalSlug[] = [...CLOUD_CANONICAL_SLUGS],
): Promise<Map<CloudCanonicalSlug, LiveCloudStatusRow>> {
  const results = new Map<CloudCanonicalSlug, LiveCloudStatusRow>();
  const now = new Date().toISOString();

  await Promise.all(
    slugs.map(async (slug) => {
      const feed = CLOUD_FEEDS[slug];
      const data =
        feed.type === "atom"
          ? await fetchServiceStatusFromAtom(feed.url)
          : await fetchServiceStatus(feed.url);

      const lastIncident = data.lastIncident;
      results.set(slug, {
        service_slug: slug,
        status: data.status,
        last_incident: lastIncident?.createdAt ?? null,
        last_incident_details: lastIncident
          ? {
              title: lastIncident.title,
              description: lastIncident.description,
              status: lastIncident.status,
              createdAt: lastIncident.createdAt,
              updatedAt: lastIncident.updatedAt,
              components: lastIncident.components,
            }
          : null,
        updated_at: now,
        source: "live-feed",
      });
    }),
  );

  return results;
}

export function isCloudCanonicalSlug(
  slug: string,
): slug is CloudCanonicalSlug {
  return (CLOUD_CANONICAL_SLUGS as readonly string[]).includes(slug);
}
