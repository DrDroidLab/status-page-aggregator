#!/usr/bin/env node
/**
 * Live check: AWS / GCP / Azure official status feeds parse to a known status.
 * Run: node scripts/verify-cloud-providers.mjs
 */
import { XMLParser } from "fast-xml-parser";

const HEADERS = {
  "User-Agent": "DrDroid-StatusAggregator/1.0 (+verify-cloud-providers)",
  Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
};

const FEEDS = [
  {
    name: "AWS",
    slug: "aws",
    type: "rss",
    url: "https://status.aws.amazon.com/rss/all.rss",
  },
  {
    name: "Google Cloud",
    slug: "google-cloud",
    type: "atom",
    url: "https://status.cloud.google.com/en/feed.atom",
  },
  {
    name: "Microsoft Azure",
    slug: "azure",
    type: "rss",
    url: "https://azure.status.microsoft/en-us/status/feed/",
  },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "__text",
  parseTagValue: false,
  trimValues: true,
});

function summarizeRss(xml) {
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return { itemCount: list.length, latestTitle: list[0]?.title ?? null };
}

function summarizeAtom(xml) {
  const parsed = parser.parse(xml);
  let entries = parsed?.feed?.entry ?? [];
  if (!Array.isArray(entries)) entries = entries ? [entries] : [];
  return { itemCount: entries.length, latestTitle: entries[0]?.title ?? null };
}

async function checkFeed(feed) {
  const res = await fetch(feed.url, { headers: HEADERS });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const summary =
    feed.type === "atom" ? summarizeAtom(body) : summarizeRss(body);
  return {
    ...feed,
    ok: true,
    httpStatus: res.status,
    ...summary,
    note:
      feed.slug === "azure" && summary.itemCount === 0
        ? "Empty feed is normal when Azure has no active incidents"
        : undefined,
  };
}

async function main() {
  console.log("Verifying cloud provider status feeds...\n");
  let failed = 0;
  for (const feed of FEEDS) {
    try {
      const result = await checkFeed(feed);
      console.log(`✅ ${result.name} (${result.slug})`);
      console.log(`   URL: ${result.url}`);
      console.log(`   HTTP ${result.httpStatus}, entries: ${result.itemCount}`);
      if (result.latestTitle) console.log(`   Latest: ${result.latestTitle}`);
      if (result.note) console.log(`   Note: ${result.note}`);
      console.log();
    } catch (err) {
      failed++;
      console.error(`❌ ${feed.name}: ${err.message}\n`);
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
