# Cloud provider status (AWS, GCP, Azure)

## Coverage

| Provider | Canonical `service_slug` | Sync source | Feed URL |
|----------|------------------------|-------------|----------|
| AWS | `aws` | RSS (`services_rss`) | `https://status.aws.amazon.com/rss/all.rss` |
| Google Cloud | `google-cloud` | Atom (`services_atom`) | `https://status.cloud.google.com/en/feed.atom` |
| Microsoft Azure | `azure` | RSS (`services_rss`) | `https://azure.status.microsoft/en-us/status/feed/` |

Also synced for UI / vendor slug compatibility:

- `google-cloud-platform` → same Atom feed as `google-cloud`
- `microsoft-azure` → same RSS feed as `azure`

## API slug aliases

`POST /api/services/status` resolves aliases before querying Supabase:

| Request slug | Resolves to |
|--------------|-------------|
| `microsoft-azure`, `ms-azure` | `azure` |
| `google-cloud-platform`, `gcp` | `google-cloud` |
| `amazon-web-services`, `amazon` | `aws` |

See `lib/serviceSlugAliases.ts`.

## Azure notes

- Azure was **missing** from `Supabase-Deno_Script.ts` before 2026-05 — only listed in notification triggers, so the DB never received Azure rows.
- The official RSS feed is **empty when all services are healthy**. An empty feed is parsed as **operational**, which is correct.
- When Azure has an active incident, items appear in the feed and status becomes `incident` / `maintenance` per feed text.

## Verify feeds locally

```bash
node scripts/verify-cloud-providers.mjs
```

## Deploy checklist

1. Merge branch and deploy the Next.js app (API alias support).
2. Deploy updated **Supabase Edge Function** (`Supabase-Deno_Script.ts`) so cron populates `azure`, `microsoft-azure`, and `google-cloud-platform`.
3. Wait one sync cycle, then test:

```bash
curl -s -X POST "$AGGREGATOR_URL/api/services/status" \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"services":["aws","gcp","microsoft-azure"]}'
```

Expect `found: true` and a status other than `unknown` for each.
