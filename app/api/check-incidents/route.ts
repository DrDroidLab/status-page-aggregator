import { NextRequest, NextResponse } from "next/server";
import { sendIncidentNotification } from "@/lib/email";
import { supabase } from "@/lib/supabase";
import { type ServiceStatus } from "@/lib/status";

// Services to monitor as specified by your boss
const MONITORED_SERVICES = [
  { name: "OpenAI", slug: "openai" },
  { name: "Supabase", slug: "supabase" },
  { name: "Render", slug: "render" },
  { name: "Claude", slug: "anthropic" },
  { name: "Vercel", slug: "vercel" },
  { name: "Cloudflare", slug: "cloudflare" },
  { name: "QDrant", slug: "qdrant" },
  { name: "Clerk", slug: "clerk" },
  { name: "Slack", slug: "slack" },
];

// Function to check if a status indicates an incident
function hasIncident(status: ServiceStatus): boolean {
  return status === "degraded" || status === "outage" || status === "incident";
}

// Function to update the last notified status in Supabase
async function updateLastNotifiedStatus(
  serviceSlug: string,
  status: ServiceStatus
) {
  try {
    const { error } = await supabase
      .from("service_status")
      .update({ last_notified_status: status })
      .eq("service_slug", serviceSlug);

    if (error) {
      console.error(
        `❌ Failed to update last notified status for ${serviceSlug}:`,
        error
      );
    } else {
      console.log(
        `✅ Updated last notified status for ${serviceSlug} to ${status}`
      );
    }
  } catch (error) {
    console.error(
      `❌ Error updating last notified status for ${serviceSlug}:`,
      error
    );
  }
}

// Function to get status data from Supabase
async function getStatusFromSupabase() {
  try {
    console.log("📊 Fetching status data from Supabase...");

    const { data, error } = await supabase.from("service_status").select("*");

    if (error) {
      console.error("❌ Supabase query error:", error);
      return null;
    }

    console.log(
      `✅ Retrieved ${data?.length || 0} service statuses from Supabase`
    );

    // Convert to a map for easy lookup
    const statusMap = (data || []).reduce(
      (acc: Record<string, any>, row: any) => {
        acc[row.service_slug] = {
          status: row.status,
          lastNotifiedStatus: row.last_notified_status, // Track what we last notified about
          lastIncident: row.last_incident
            ? {
                title: row.last_incident_title || "Service Incident",
                description:
                  row.last_incident_description ||
                  "Service experiencing issues",
                status: "identified" as const,
                createdAt: row.last_incident,
                updatedAt: row.updated_at || row.last_incident,
                components: [],
                htmlDescription:
                  row.last_incident_description ||
                  "Service experiencing issues",
              }
            : undefined,
        };
        return acc;
      },
      {} as Record<string, any>
    );

    return statusMap;
  } catch (error) {
    console.error("❌ Error fetching status from Supabase:", error);
    return null;
  }
}

// Function to send consolidated incident notification
async function sendConsolidatedIncidentNotification(
  impactedServices: Array<{
    name: string;
    slug: string;
    status: ServiceStatus;
    lastIncident?: any;
  }>
): Promise<boolean> {
  try {
    if (impactedServices.length === 0) return true;

    const subject = `🚨 Service Status Alert - ${
      impactedServices.length
    } Service${impactedServices.length > 1 ? "s" : ""} Impacted`;

    // Create service list for email
    const serviceList = impactedServices
      .map((service) => `• ${service.name}: ${service.status.toUpperCase()}`)
      .join("\n");

    // Create detailed incident info
    let incidentDetails = "";
    impactedServices.forEach((service) => {
      if (service.lastIncident) {
        incidentDetails += `\n\n${service.name} Incident Details:
- Title: ${service.lastIncident.title}
- Description: ${service.lastIncident.description}
- Created: ${service.lastIncident.createdAt}`;
      }
    });

    const emailBody = `
Service Status Alert

IMPACTED SERVICES (${impactedServices.length}):
${serviceList}

${incidentDetails}

This is an automated notification from your status monitoring system.

Time: ${new Date().toISOString()}
    `;

    const mockStatusData = {
      status: impactedServices[0].status,
      lastIncident: impactedServices[0].lastIncident,
      incidents: [],
    };

    console.log("📧 SENDING CONSOLIDATED NOTIFICATION:");
    console.log("Subject:", subject);
    console.log(
      "Impacted services:",
      impactedServices.map((s) => s.name).join(", ")
    );

    // Send email using existing function
    await sendIncidentNotification(
      `${impactedServices.length} Services`,
      mockStatusData
    );

    // Update the last notified status for all services
    for (const service of impactedServices) {
      await updateLastNotifiedStatus(service.slug, service.status);
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to send consolidated notification:", error);
    return false;
  }
}

// Main function to check all services and detect changes
async function checkAllServices() {
  const results = [];
  const statusChanges: Array<{
    service: string;
    oldStatus: ServiceStatus;
    newStatus: ServiceStatus;
  }> = [];

  // Get status data from Supabase
  const statusMap = await getStatusFromSupabase();

  if (!statusMap) {
    console.error("❌ Failed to fetch status data from Supabase");
    return [
      {
        service: "System",
        status: "error",
        incident: false,
        notificationSent: false,
        statusChanged: false,
        error: "Failed to fetch status data from Supabase",
      },
    ];
  }

  for (const service of MONITORED_SERVICES) {
    try {
      const serviceData = statusMap[service.slug];

      if (!serviceData) {
        console.warn(
          `⚠️ No status data found for ${service.name} (${service.slug})`
        );
        results.push({
          service: service.name,
          status: "unknown",
          incident: false,
          notificationSent: false,
          statusChanged: false,
          error: "No status data found in Supabase",
        });
        continue;
      }

      const currentStatus = serviceData.status as ServiceStatus;
      const lastNotifiedStatus = serviceData.lastNotifiedStatus;
      // Detect changes: either first time (null) or actual status change
      const statusChanged =
        !lastNotifiedStatus || lastNotifiedStatus !== currentStatus;

      // Track status changes
      if (statusChanged) {
        statusChanges.push({
          service: service.name,
          oldStatus: lastNotifiedStatus,
          newStatus: currentStatus,
        });
        console.log(
          `🔄 Status change detected for ${service.name}: ${lastNotifiedStatus} → ${currentStatus}`
        );
      }

      results.push({
        service: service.name,
        status: currentStatus,
        incident: hasIncident(currentStatus),
        notificationSent: false, // Will be updated later if notification is sent
        statusChanged: !!statusChanged,
        lastNotifiedStatus,
      });
    } catch (error) {
      console.error(`❌ Error checking ${service.name}:`, error);
      results.push({
        service: service.name,
        status: "error",
        incident: false,
        notificationSent: false,
        statusChanged: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // If there are status changes, send consolidated notification
  let notificationSent = false;
  if (statusChanges.length > 0) {
    console.log(
      `📢 ${statusChanges.length} status change(s) detected, checking for notifications...`
    );

    // Get all currently impacted services
    const currentlyImpacted = results
      .filter((result) => hasIncident(result.status as ServiceStatus))
      .map((result) => {
        const serviceData =
          statusMap[
            MONITORED_SERVICES.find((s) => s.name === result.service)?.slug ||
              ""
          ];
        const serviceSlug =
          MONITORED_SERVICES.find((s) => s.name === result.service)?.slug || "";
        return {
          name: result.service,
          slug: serviceSlug,
          status: result.status as ServiceStatus,
          lastIncident: serviceData?.lastIncident,
        };
      });

    if (currentlyImpacted.length > 0) {
      console.log(
        `🚨 Sending notification for ${currentlyImpacted.length} currently impacted services`
      );
      notificationSent = await sendConsolidatedIncidentNotification(
        currentlyImpacted
      );

      // Update notification status for all results
      results.forEach((result) => {
        if (hasIncident(result.status as ServiceStatus)) {
          result.notificationSent = notificationSent;
        }
      });
    } else {
      console.log(
        "✅ Status changes detected but no services currently impacted"
      );
    }

    // FIXED: Always update last_notified_status for ALL services that changed status
    // This ensures we track both recoveries and new incidents properly
    console.log("🔄 Updating last_notified_status for all changed services...");
    console.log("💾 DEBUG - Status changes detected:", statusChanges);
    for (const change of statusChanges) {
      const serviceSlug = MONITORED_SERVICES.find(
        (s) => s.name === change.service
      )?.slug;
      console.log(
        `🔍 DEBUG - Processing ${change.service} (${serviceSlug}): ${change.oldStatus} → ${change.newStatus}`
      );
      if (serviceSlug) {
        console.log(
          `📝 DEBUG - About to update last_notified_status for ${serviceSlug} to ${change.newStatus}`
        );
        await updateLastNotifiedStatus(serviceSlug, change.newStatus);
        console.log(
          `✅ Updated ${change.service}: ${change.oldStatus} → ${change.newStatus}`
        );
      } else {
        console.log(`❌ DEBUG - No serviceSlug found for ${change.service}`);
      }
    }
  } else {
    console.log("📊 No status changes detected");
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Starting incident check for monitored services...");
    const results = await checkAllServices();

    const incidentCount = results.filter((r) => r.incident).length;
    const changesCount = results.filter((r) => r.statusChanged).length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Checked ${results.length} services, found ${incidentCount} incidents, ${changesCount} status changes`,
      results,
    });
  } catch (error) {
    console.error("❌ Error in incident check:", error);
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
