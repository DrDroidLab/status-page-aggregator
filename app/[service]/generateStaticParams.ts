export async function generateStaticParams() {
  return [
    { service: "aws" },
    { service: "google-cloud" },
    { service: "azure" },
    { service: "mongodb" },
    { service: "postgresql" },
    { service: "redis" },
    { service: "stripe" },
    { service: "github" },
    { service: "cloudflare" },
    { service: "supabase" },
    { service: "vercel" },
    { service: "planetscale" },
    { service: "inkeep" },
  ]
}
