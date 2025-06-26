import { NextRequest, NextResponse } from "next/server";
import {
  fetchServiceStatus,
  fetchServiceStatusFromAtom,
  fetchServiceStatusFromAPI,
  type ServiceStatusData,
  type ServiceStatus,
} from "@/lib/status";
import { sendIncidentNotification } from "@/lib/email";

// Services to monitor as specified by your boss
const MONITORED_SERVICES = [
  { name: "OpenAI", slug: "openai" },
  { name: "Azure", slug: "azure" },
  { name: "Supabase", slug: "supabase" },
  { name: "Render", slug: "render" },
  { name: "Claude", slug: "anthropic" },
  { name: "Vercel", slug: "vercel" },
  { name: "Cloudflare", slug: "cloudflare" },
  { name: "QDrant", slug: "qdrant" },
  { name: "Clerk", slug: "clerk" },
  { name: "Slack", slug: "slack" },
];

// Function to get RSS/Atom/API URLs for each service
function getServiceDataUrl(serviceSlug: string) {
  const rssUrls: { [key: string]: string } = {
    openai: "https://status.openai.com/history.rss",
    azure: "https://status.azure.com/en-us/status/feed/",
    supabase: "https://status.supabase.com/history.rss",
    render: "https://status.render.com/history.rss",
    anthropic: "https://status.anthropic.com/history.rss",
    vercel: "https://www.vercel-status.com/history.rss",
    cloudflare: "https://www.cloudflarestatus.com/history.rss",
    qdrant: "https://status.qdrant.io/feed.rss",
    clerk: "https://status.clerk.com/feed.rss",
    slack: "https://status.slack.com/feed/rss",
  };

  const atomUrls: { [key: string]: string } = {
    // Add atom URLs if needed
  };

  const apiUrls: { [key: string]: { status: string; incidents: string } } = {
    cloudflare: {
      status: "https://www.cloudflarestatus.com/api/v2/summary.json",
      incidents: "https://www.cloudflarestatus.com/api/v2/incidents.json",
    },
    supabase: {
      status: "https://status.supabase.com/api/v2/status.json",
      incidents: "https://status.supabase.com/api/v2/incidents.json",
    },
    anthropic: {
      status: "https://status.anthropic.com/api/v2/status.json",
      incidents: "https://status.anthropic.com/api/v2/incidents.json",
    },
    openai: {
      status: "https://status.openai.com/api/v2/summary.json",
      incidents: "https://status.openai.com/api/v2/incidents.json",
    },
  };

  return {
    rss: rssUrls[serviceSlug],
    atom: atomUrls[serviceSlug],
    api: apiUrls[serviceSlug],
  };
}

// Function to check if a status indicates an incident
function hasIncident(status: ServiceStatus): boolean {
  return status === "degraded" || status === "outage" || status === "incident";
}

// Main function to check all services
async function checkAllServices() {
  const results = [];

  for (const service of MONITORED_SERVICES) {
    try {
      const urls = getServiceDataUrl(service.slug);
      let statusData: ServiceStatusData;

      // Try different data sources in order of preference
      if (urls.api) {
        statusData = await fetchServiceStatusFromAPI(
          urls.api.status,
          urls.api.incidents
        );
      } else if (urls.rss) {
        statusData = await fetchServiceStatus(urls.rss);
      } else if (urls.atom) {
        statusData = await fetchServiceStatusFromAtom(urls.atom);
      } else {
        console.warn(`No data source configured for ${service.name}`);
        continue;
      }

      // Check if there's an incident
      if (hasIncident(statusData.status)) {
        console.log(
          `🚨 Incident detected for ${service.name}: ${statusData.status}`
        );

        // Send notification
        const notificationSent = await sendIncidentNotification(
          service.name,
          statusData
        );

        results.push({
          service: service.name,
          status: statusData.status,
          incident: true,
          notificationSent,
        });
      } else {
        console.log(`✅ ${service.name} is operational`);
        results.push({
          service: service.name,
          status: statusData.status,
          incident: false,
          notificationSent: false,
        });
      }
    } catch (error) {
      console.error(`Error checking ${service.name}:`, error);
      results.push({
        service: service.name,
        status: "error",
        incident: false,
        notificationSent: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Starting incident check for monitored services...");
    const results = await checkAllServices();

    const incidentCount = results.filter((r) => r.incident).length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Checked ${results.length} services, found ${incidentCount} incidents`,
      results,
    });
  } catch (error) {
    console.error("Error in incident check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow manual triggering via POST
  return GET(request);
}
