/**
 * Maps alternate vendor slugs (UI / external_vendors / agent) to canonical
 * service_slug rows populated by the Supabase status sync job.
 */
const SERVICE_SLUG_ALIASES: Record<string, string> = {
  // Microsoft Azure
  azure: "azure",
  "microsoft-azure": "azure",
  "ms-azure": "azure",

  // Google Cloud
  gcp: "google-cloud",
  "google-cloud-platform": "google-cloud",
  "google-cloud": "google-cloud",

  // Amazon Web Services
  amazon: "aws",
  "amazon-web-services": "aws",
  aws: "aws",
};

/** Resolve a user-facing slug to the canonical DB slug. */
export function resolveServiceSlug(slug: string): string {
  const normalized = slug.toLowerCase().trim().replace(/\s+/g, "-");
  return SERVICE_SLUG_ALIASES[normalized] ?? normalized;
}

/** Expand canonical slugs to include aliases (for bulk lookups). */
export function expandSlugQuery(slugs: string[]): string[] {
  const expanded = new Set<string>();
  for (const slug of slugs) {
    const canonical = resolveServiceSlug(slug);
    expanded.add(canonical);
    for (const [alias, target] of Object.entries(SERVICE_SLUG_ALIASES)) {
      if (target === canonical) expanded.add(alias);
    }
  }
  return [...expanded];
}
