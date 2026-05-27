import { resolveServiceSlug } from "@/lib/serviceSlugAliases";
import {
  fetchServiceStatus,
  fetchServiceStatusFromAPI,
  fetchServiceStatusFromAtom,
  fetchServiceStatusFromBetterStack,
  type ServiceStatusData,
} from "@/lib/status";
import { supabase } from "@/lib/supabase";

const CLOUD_RSS: Record<string, string> = {
  aws: "https://status.aws.amazon.com/rss/all.rss",
  azure: "https://azure.status.microsoft/en-us/status/feed/",
};

const CLOUD_ATOM: Record<string, string> = {
  "google-cloud": "https://status.cloud.google.com/en/feed.atom",
};

/** Statuspage JSON APIs (subset — matches detail page switches). */
const STATUSPAGE_JSON: Record<string, { status: string; incidents: string }> = {
  openai: {
    status: "https://status.openai.com/api/v2/status.json",
    incidents: "https://status.openai.com/api/v2/incidents.json",
  },
  anthropic: {
    status: "https://status.anthropic.com/api/v2/status.json",
    incidents: "https://status.anthropic.com/api/v2/incidents.json",
  },
  supabase: {
    status: "https://status.supabase.com/api/v2/status.json",
    incidents: "https://status.supabase.com/api/v2/incidents.json",
  },
  vercel: {
    status: "https://www.vercel-status.com/api/v2/status.json",
    incidents: "https://www.vercel-status.com/api/v2/incidents.json",
  },
  cloudflare: {
    status: "https://www.cloudflarestatus.com/api/v2/summary.json",
    incidents: "https://www.cloudflarestatus.com/api/v2/incidents.json",
  },
};

async function statusFromSupabase(slug: string): Promise<ServiceStatusData | null> {
  const canonical = resolveServiceSlug(slug);
  const slugs = [slug, canonical].filter((s, i, a) => a.indexOf(s) === i);

  const { data } = await supabase
    .from("service_status")
    .select("status, last_incident, last_incident_details")
    .in("service_slug", slugs)
    .limit(1);

  const row = data?.[0];
  if (!row) return null;

  const details = row.last_incident_details as {
    title?: string;
    description?: string;
    createdAt?: string;
  } | null;

  return {
    status: row.status as ServiceStatusData["status"],
    incidents: details
      ? [
          {
            title: details.title ?? "Recent incident",
            description: details.description ?? "",
            htmlDescription: details.description ?? "",
            status: "resolved",
            createdAt: details.createdAt ?? row.last_incident ?? "",
            updatedAt: details.createdAt ?? row.last_incident ?? "",
            components: [],
          },
        ]
      : [],
    lastIncident: row.last_incident
      ? {
          title: details?.title ?? "Recent incident",
          description: details?.description ?? "",
          htmlDescription: details?.description ?? "",
          status: "resolved",
          createdAt: row.last_incident,
          updatedAt: row.last_incident,
          components: [],
        }
      : undefined,
  };
}

/** Fetch status for any catalog slug (cloud aliases, Supabase, or live feeds). */
export async function fetchDetailPageStatus(
  slug: string,
): Promise<ServiceStatusData> {
  const fromDb = await statusFromSupabase(slug);
  if (fromDb) return fromDb;

  const canonical = resolveServiceSlug(slug);

  if (CLOUD_RSS[canonical]) {
    return fetchServiceStatus(CLOUD_RSS[canonical]);
  }
  if (CLOUD_ATOM[canonical]) {
    return fetchServiceStatusFromAtom(CLOUD_ATOM[canonical]);
  }

  const json = STATUSPAGE_JSON[slug] ?? STATUSPAGE_JSON[canonical];
  if (json) {
    return fetchServiceStatusFromAPI(json.status, json.incidents);
  }

  if (slug === "inkeep" || canonical === "inkeep") {
    return fetchServiceStatusFromBetterStack(
      "https://status.inkeep.com/index.json",
      "https://status.inkeep.com/feed",
    );
  }

  return { status: "unknown", incidents: [] };
}
