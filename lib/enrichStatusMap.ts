import { resolveServiceSlug } from "@/lib/serviceSlugAliases";

export type StatusMapEntry = {
  status: string;
  last_incident?: { createdAt: string };
};

/** Copy canonical cloud rows onto product-specific slugs (azure-speech → azure). */
export function applyCanonicalAliasesToStatusMap(
  map: Record<string, StatusMapEntry>,
  serviceSlugs: string[] = [],
): Record<string, StatusMapEntry> {
  const out: Record<string, StatusMapEntry> = { ...map };

  const slugs = new Set([
    ...Object.keys(map),
    ...serviceSlugs,
  ]);

  for (const slug of slugs) {
    const canonical = resolveServiceSlug(slug);
    if (!out[slug] && out[canonical]) {
      out[slug] = out[canonical];
    }
  }

  return out;
}

export function statusMapEntryFromLive(
  status: string,
  lastIncident?: { createdAt: string },
): StatusMapEntry {
  return {
    status,
    ...(lastIncident ? { last_incident: lastIncident } : {}),
  };
}
