import { getCatalogService } from "@/lib/servicesCatalog";

export type DetailService = {
  name: string;
  slug: string;
  statusUrl: string;
  communityUrl: string;
  tags: string[];
  description: string;
  faq: { question: string; answer: string }[];
};

function genericFaq(name: string, statusUrl: string) {
  return [
    {
      question: `Is ${name} down right now?`,
      answer: `Check the live status indicator at the top of this page. For official updates, visit ${statusUrl}.`,
    },
    {
      question: `How do I monitor ${name} status?`,
      answer: `Bookmark this page or subscribe to the official status page RSS/Atom feed at ${statusUrl}.`,
    },
  ];
}

/** Rich SEO page data, or catalog entry with generic copy. */
export function resolveDetailService(
  slug: string,
  richBySlug: Record<string, Partial<DetailService> & { name: string; slug: string }>,
): DetailService | null {
  const rich = richBySlug[slug];
  if (rich && rich.statusUrl && rich.communityUrl && rich.tags) {
    return {
      name: rich.name,
      slug: rich.slug,
      statusUrl: rich.statusUrl,
      communityUrl: rich.communityUrl,
      tags: rich.tags,
      description:
        rich.description ??
        `${rich.name} status and incident history aggregated by DrDroid.`,
      faq: rich.faq ?? genericFaq(rich.name, rich.statusUrl),
    };
  }

  const catalog = getCatalogService(slug);
  if (!catalog) return null;

  return {
    name: catalog.name,
    slug: catalog.slug,
    statusUrl: catalog.statusUrl,
    communityUrl: catalog.communityUrl,
    tags: catalog.tags,
    description: `${catalog.name} status and incident history aggregated by DrDroid Status Page Aggregator.`,
    faq: genericFaq(catalog.name, catalog.statusUrl),
  };
}
