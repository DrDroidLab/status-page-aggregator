# API authentication (`POST /api/services/status`)

Clients must send a valid key via `Authorization: Bearer <key>` or `X-API-Key`.

## Environment variables (Render / Vercel)

| Variable | Used by |
|----------|---------|
| `EXTERNAL_API_KEY` | Cloud SaaS (aiops-v0, Falcon) |
| `ON_PREM_API_KEY` | DrDroid on-prem installs only |

At least one must be set. Both may be set with **different** values so you can rotate or revoke on-prem access independently.

Generate a new key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## On-prem (drdroid-on-prem)

1. Set `ON_PREM_API_KEY` on the status-page-aggregator deployment (Render).
2. Set the **same value** in Helm as `secrets.statusPageApiKey` (injected as `STATUS_PAGE_API_KEY` + `STATUS_PAGE_ENABLED=true` in podracer/falcon).

Full on-prem operator guide: [drdroid-on-prem `docs/features/vendor-status`](https://github.com/DrDroidLab/drdroid-on-prem/blob/main/docs/features/vendor-status/README.md).

## Cloud (aiops-v0)

Set `EXTERNAL_API_KEY` on the aggregator and `STATUS_PAGE_API_KEY` on clients to the same value.
