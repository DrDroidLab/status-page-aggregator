// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import fetch from "npm:node-fetch@2";
// Supabase setup
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
// Email API endpoint
const EMAIL_API_URL = "<you-email-where-you-want-to-receive-the-notification>";
// High-priority services that trigger notifications when they change
const NOTIFICATION_TRIGGER_SERVICES = new Set([
  "openai",
  "azure",
  "supabase",
  "render",
  "anthropic",
  "vercel",
  "cloudflare",
  "qdrant",
  "clerk",
  "slack",
]);
// Services with JSON status APIs only
const services_json = [
  {
    slug: "supabase",
    name: "Supabase",
    api: "https://status.supabase.com/api/v2/status.json",
    incident_api: "https://status.supabase.com/api/v2/incidents.json",
  },
  {
    slug: "redis",
    name: "Redis",
    api: "https://status.redis.io/api/v2/status.json",
    incident_api: "https://status.redis.io/api/v2/incidents.json",
  },
  {
    slug: "cursor",
    name: "Cursor",
    api: "https://status.cursor.com/api/v2/status.json",
    incident_api: "https://status.cursor.com/api/v2/incidents.json",
  },
  {
    slug: "anthropic",
    name: "Claude",
    api: "https://status.anthropic.com/api/v2/status.json",
    incident_api: "https://status.anthropic.com/api/v2/incidents.json",
  },
  {
    slug: "cohere",
    name: "Cohere",
    api: "https://status.cohere.com/api/v2/status.json",
    incident_api: "https://status.cohere.com/api/v2/incidents.json",
  },
  {
    slug: "openai",
    name: "OpenAI",
    api: "https://status.openai.com/api/v2/status.json",
    incident_api: "https://status.openai.com/api/v2/incidents.json",
  },
  {
    slug: "linode",
    name: "Linode",
    api: "https://status.linode.com/api/v2/status.json",
    incident_api: "https://status.linode.com/api/v2/incidents.json",
  },
  {
    slug: "digitalocean",
    name: "DigitalOcean",
    api: "https://status.digitalocean.com/api/v2/status.json",
    incident_api: "https://status.digitalocean.com/api/v2/incidents.json",
  },
  {
    slug: "replicate",
    name: "Replicate",
    api: "https://replicatestatus.com/api/v2/status.json",
    incident_api: "https://replicatestatus.com/api/v2/incidents.json",
  },
  {
    slug: "jira",
    name: "Jira",
    api: "https://jira-software.status.atlassian.com/api/v2/status.json",
    incident_api:
      "https://jira-software.status.atlassian.com/api/v2/incidents.json",
  },
  {
    slug: "bitbucket",
    name: "Bitbucket",
    api: "https://bitbucket.status.atlassian.com/api/v2/status.json",
    incident_api:
      "https://bitbucket.status.atlassian.com/api/v2/incidents.json",
  },
  {
    slug: "confluence",
    name: "Confluence",
    api: "https://confluence.status.atlassian.com/api/v2/status.json",
    incident_api:
      "https://confluence.status.atlassian.com/api/v2/incidents.json",
  },
  {
    slug: "trello",
    name: "Trello",
    api: "https://trello.status.atlassian.com/api/v2/status.json",
    incident_api: "https://trello.status.atlassian.com/api/v2/incidents.json",
  },
  {
    slug: "snowflake",
    name: "Snowflake",
    api: "https://status.snowflake.com/api/v2/summary.json",
    incident_api: "https://status.snowflake.com/api/v2/incidents.json",
  },
  {
    slug: "confluent",
    name: "Confluent",
    api: "https://status.confluent.cloud/api/v2/summary.json",
    incident_api: "https://status.confluent.cloud/api/v2/incidents.json",
  },
  {
    slug: "chargebee",
    name: "Chargebee",
    api: "https://status.chargebee.com/api/v2/summary.json",
    incident_api: "https://status.chargebee.com/api/v2/incidents.json",
  },
  {
    slug: "twilio",
    name: "Twilio",
    api: "https://status.twilio.com/api/v2/summary.json",
    incident_api: "https://status.twilio.com/api/v2/incidents.json",
  },
  {
    slug: "sendgrid",
    name: "SendGrid",
    api: "https://status.sendgrid.com/api/v2/summary.json",
    incident_api: "https://status.sendgrid.com/api/v2/incidents.json",
  },
  {
    slug: "cloudflare",
    name: "Cloudflare",
    api: "https://www.cloudflarestatus.com/api/v2/summary.json",
    incident_api: "https://www.cloudflarestatus.com/api/v2/incidents.json",
  },
  {
    slug: "fastly",
    name: "Fastly",
    api: "https://www.fastlystatus.com/status.json",
    incident_api: "https://www.fastlystatus.com/incidents.json",
  },
];
// Services that need RSS scraping
const services_rss = [
  {
    slug: "slack",
    name: "Slack",
    rss_url: "https://slack-status.com/feed/rss",
  },
  {
    slug: "render",
    name: "Render",
    rss_url: "https://status.render.com/history.rss",
  },
  {
    slug: "vercel",
    name: "Vercel",
    rss_url: "https://www.vercel-status.com/history.rss",
  },
  {
    slug: "clerk",
    name: "Clerk",
    rss_url: "https://status.clerk.com/feed.rss",
  },
  {
    slug: "xai",
    name: "xAI",
    rss_url: "https://status.x.ai/feed.xml",
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    rss_url: "https://status.elevenlabs.io/feed.rss",
  },
  {
    slug: "pinecone",
    name: "Pinecone",
    rss_url: "https://status.pinecone.io/history.rss",
  },
  {
    slug: "mongodb-atlas",
    name: "MongoDB Atlas",
    rss_url: "https://status.mongodb.com/history.rss",
  },
  {
    slug: "assemblyai",
    name: "AssemblyAI",
    rss_url: "https://status.assemblyai.com/history.rss",
  },
  {
    slug: "huggingface",
    name: "Hugging Face",
    rss_url: "https://status.huggingface.co/feed.rss",
  },
  {
    slug: "qdrant",
    name: "Qdrant",
    rss_url: "https://status.qdrant.io/feed.rss",
  },
  {
    slug: "modal",
    name: "Modal",
    rss_url: "https://status.modal.com/feed.rss",
  },
  {
    slug: "bunny-net",
    name: "Bunny.net",
    rss_url: "https://status.bunny.net/history.rss",
  },
  {
    slug: "netlify",
    name: "Netlify",
    rss_url: "https://www.netlifystatus.com/history.rss",
  },
];
// Services that need Atom feed scraping
const services_atom = [
  {
    slug: "google-cloud",
    name: "Google Cloud",
    atom_url: "https://status.cloud.google.com/en/feed.atom",
  },
  {
    slug: "deepgram",
    name: "Deepgram",
    atom_url: "https://status.deepgram.com/history.atom",
  },
];
// Create a map for service name lookup
const serviceNameMap = new Map();
services_json.forEach((s) => serviceNameMap.set(s.slug, s.name));
services_rss.forEach((s) => serviceNameMap.set(s.slug, s.name));
services_atom.forEach((s) => serviceNameMap.set(s.slug, s.name));
// Send email notification
async function sendEmailNotification(subject, message) {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        message,
      }),
    });
    if (!response.ok) {
      console.error(
        `Failed to send email: ${response.status} ${response.statusText}`
      );
    } else {
      console.log("Email notification sent successfully");
    }
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}
// Get current statuses from database
async function getCurrentStatuses() {
  const { data, error } = await supabase
    .from("service_status")
    .select("service_slug, status");
  if (error) {
    console.error("Error fetching current statuses:", error);
    return new Map();
  }
  const statusMap = new Map();
  data?.forEach((row) => {
    statusMap.set(row.service_slug, row.status);
  });
  return statusMap;
}
// Get services currently experiencing incidents
async function getIncidentServices() {
  const { data, error } = await supabase
    .from("service_status")
    .select("service_slug")
    .eq("status", "incident");
  if (error) {
    console.error("Error fetching incident services:", error);
    return [];
  }
  return (
    data?.map((row) => ({
      slug: row.service_slug,
      name: serviceNameMap.get(row.service_slug) || row.service_slug,
    })) || []
  );
}
// Format status change message
function formatStatusChangeMessage(changes, incidentServices) {
  let message = "High-Priority Service Status Updates:\n\n";
  // Add status changes
  changes.forEach((change) => {
    const statusEmoji =
      change.new_status === "operational"
        ? "✅"
        : change.new_status === "incident"
        ? "🚨"
        : change.new_status === "maintenance"
        ? "🔧"
        : "❓";
    message += `${statusEmoji} ${change.service_name}: ${change.old_status} → ${change.new_status}\n`;
  });
  // Add current incident services if any
  if (incidentServices.length > 0) {
    message += "\n🚨 All Services Currently Experiencing Incidents:\n";
    incidentServices.forEach((service) => {
      message += `• ${service.name}\n`;
    });
  } else {
    message += "\n✅ All monitored services are operational!\n";
  }
  return message;
}
// Check if any of the changes are for notification trigger services
function shouldSendNotification(changes) {
  return changes.some((change) =>
    NOTIFICATION_TRIGGER_SERVICES.has(change.service_slug)
  );
}
// Normalize text-based status values
function normalizeStatus(text) {
  const str = text.toLowerCase();
  if (
    str.includes("operational") ||
    str.includes("available") ||
    str.includes("none") ||
    str.includes("100.000% uptime")
  )
    return "operational";
  if (
    str.includes("degraded") ||
    str.includes("partial") ||
    str.includes("slow") ||
    str.includes("performance")
  )
    return "degraded";
  if (
    str.includes("minor") ||
    str.includes("major") ||
    str.includes("outage") ||
    str.includes("incident") ||
    str.includes("disruption") ||
    str.includes("monitoring")
  )
    return "incident";
  if (str.includes("maintenance")) return "maintenance";
  return "unknown";
}
// Fetch latest incident from incident API
async function fetchLatestIncident(incidentApiUrl) {
  if (!incidentApiUrl) return { timestamp: null, details: null };
  try {
    const res = await fetch(incidentApiUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${incidentApiUrl}`);
    const json = await res.json();
    const incidents = json?.incidents || [];
    if (incidents.length === 0) {
      return { timestamp: null, details: null };
    }
    // Find the most recent incident by created_at or updated_at
    let latestIncident = null;
    let latestDate = null;
    for (const incident of incidents) {
      // Try created_at first, then updated_at, then started_at
      const createdAt = incident.created_at;
      const updatedAt = incident.updated_at;
      const startedAt = incident.started_at;
      const dateStr = createdAt || updatedAt || startedAt;
      if (dateStr) {
        try {
          const incidentDate = new Date(dateStr);
          if (!latestDate || incidentDate > latestDate) {
            latestDate = incidentDate;
            latestIncident = incident;
          }
        } catch (e) {
          console.warn(`Failed to parse incident date: ${dateStr}`);
        }
      }
    }

    if (!latestIncident) {
      return { timestamp: null, details: null };
    }

    // Extract detailed incident information
    const latestUpdate = latestIncident.incident_updates?.[0];
    const description = latestUpdate?.body || latestIncident.body || "";
    const components = latestIncident.components?.map((comp) => comp.name) ||
                     latestUpdate?.affected_components?.map((comp) => comp.name) || [];

    const incidentDetails = {
      title: latestIncident.name || latestIncident.title || "Unknown Incident",
      description: stripHtml(description),
      status: mapAPIStatusToIncidentStatus(latestIncident.status),
      createdAt: latestIncident.created_at || latestIncident.started_at,
      updatedAt: latestIncident.updated_at || latestIncident.created_at,
      components: components,
    };

    return {
      timestamp: latestDate,
      details: incidentDetails,
    };
  } catch (e) {
    console.warn(
      `Failed to fetch incidents from ${incidentApiUrl}: ${e.message}`
    );
    return { timestamp: null, details: null };
  }
}

// Helper function to strip HTML tags
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;#39;/g, "'") // Replace &amp;#39; with '
    .replace(/&amp;/g, "&") // Replace &amp; with &
    .replace(/&lt;/g, "<") // Replace &lt; with <
    .replace(/&gt;/g, ">") // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/&apos;/g, "'") // Replace &apos; with '
    .replace(/\n\s*\n/g, "\n") // Remove multiple newlines
    .trim();
}

// Helper function to map API status to incident status
function mapAPIStatusToIncidentStatus(status) {
  switch (status?.toLowerCase()) {
    case "resolved":
      return "resolved";
    case "monitoring":
      return "monitoring";
    case "identified":
      return "identified";
    case "investigating":
    default:
      return "investigating";
  }
}

// Extract components from description text (basic approach)
function extractComponentsFromText(text) {
  if (!text) return [];

  // Look for common component patterns in incident descriptions
  const componentPatterns = [
    /API/gi,
    /DNS/gi,
    /CDN/gi,
    /Database/gi,
    /Web Interface/gi,
    /Dashboard/gi,
    /Authentication/gi,
    /Storage/gi,
    /Compute/gi,
    /Networking/gi,
  ];

  const components = [];
  for (const pattern of componentPatterns) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        components.push(match[0]);
      }
    }
  }

  return [...new Set(components)]; // Remove duplicates
}

// Determine incident status from content
function determineIncidentStatus(content) {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("resolved")) return "resolved";
  if (lowerContent.includes("monitoring")) return "monitoring";
  if (lowerContent.includes("identified")) return "identified";
  return "investigating";
}

// Parse RSS feed and extract latest incident info
async function parseRSSFeed(rssUrl) {
  try {
    const response = await fetch(rssUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    const xmlText = await response.text();
    // Parse XML manually (simple approach for RSS)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = xmlText.match(itemRegex) || [];
    if (items.length === 0) {
      return {
        status: "operational",
        lastIncident: null,
        lastIncidentDetails: null,
      };
    }
    // Parse all items and sort by date (newest first)
    const parsedItems = [];
    for (const item of items) {
      const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
      const pubDateMatch = item.match(pubDateRegex);
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : null;
      if (pubDateStr) {
        try {
          const itemDate = new Date(pubDateStr);
          parsedItems.push({
            item,
            date: itemDate,
            dateStr: pubDateStr,
          });
        } catch (e) {
          console.warn(`Failed to parse date: ${pubDateStr}`);
        }
      }
    }
    // Sort by date (newest first)
    parsedItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    const now = new Date();
    // Find the first item that's not in the future
    let validItem = null;
    for (const parsedItem of parsedItems) {
      if (parsedItem.date <= now) {
        validItem = parsedItem;
        break;
      }
    }
    if (!validItem) {
      return {
        status: "operational",
        lastIncident: null,
        lastIncidentDetails: null,
      };
    }
    // Extract title from the valid item
    const titleCDataRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/;
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    let titleMatch = validItem.item.match(titleCDataRegex);
    if (!titleMatch) {
      titleMatch = validItem.item.match(titleRegex);
    }
    const title = titleMatch ? titleMatch[1].trim() : "";
    // Extract description from the valid item
    const descCDataRegex =
      /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
    const descRegex = /<description>([\s\S]*?)<\/description>/;
    let descMatch = validItem.item.match(descCDataRegex);
    if (!descMatch) {
      descMatch = validItem.item.match(descRegex);
    }
    const description = descMatch ? descMatch[1].trim() : "";
    // Check if incident is older than 24 hours
    const timeDiff = now.getTime() - validItem.date.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    // If older than 24 hours, mark as operational
    if (hoursDiff > 24) {
      return {
        status: "operational",
        lastIncident: validItem.date,
        lastIncidentDetails: null,
      };
    }
    // Within 24 hours - determine actual status
    const content = `${title} ${description}`.toLowerCase();
    let status = "operational"; // default
    // Check for maintenance
    if (
      content.includes("maintenance") ||
      content.includes("scheduled") ||
      content.includes("planned") ||
      content.includes("upgrade")
    ) {
      if (
        content.includes("resolved") ||
        content.includes("completed") ||
        content.includes("fixed") ||
        content.includes("restored")
      ) {
        status = "operational";
      } else {
        status = "maintenance";
      }
    } else if (
      content.includes("outage") ||
      content.includes("incident") ||
      content.includes("disruption") ||
      content.includes("degraded") ||
      content.includes("investigating") ||
      content.includes("monitoring")
    ) {
      if (
        content.includes("resolved") ||
        content.includes("completed") ||
        content.includes("fixed") ||
        content.includes("restored")
      ) {
        status = "operational";
      } else {
        status = "incident";
      }
    } else if (
      content.includes("resolved") ||
      content.includes("completed") ||
      content.includes("fixed") ||
      content.includes("restored")
    ) {
      status = "operational";
    }
    // Extract components from description (basic approach)
    const components = extractComponentsFromText(description);

    // Determine incident status based on content
    const incidentStatus = determineIncidentStatus(content);

    // Create detailed incident object
    const incidentDetails = {
      title: title,
      description: stripHtml(description),
      status: incidentStatus,
      createdAt: validItem.dateStr,
      updatedAt: validItem.dateStr,
      components: components,
    };

    return {
      status,
      lastIncident: validItem.date,
      lastIncidentDetails: incidentDetails,
    };
  } catch (error) {
    console.warn(`Failed to parse RSS feed ${rssUrl}: ${error.message}`);
    return {
      status: "unknown",
      lastIncident: null,
      lastIncidentDetails: null,
    };
  }
}
// Parse Atom feed and extract latest incident info
async function parseAtomFeed(atomUrl) {
  try {
    const response = await fetch(atomUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch Atom: ${response.status}`);
    const xmlText = await response.text();
    // Parse XML manually (simple approach for Atom)
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries = xmlText.match(entryRegex) || [];
    if (entries.length === 0) {
      return {
        status: "operational",
        lastIncident: null,
        lastIncidentDetails: null,
      };
    }
    // Parse all entries and sort by date (newest first)
    const parsedEntries = [];
    for (const entry of entries) {
      const updatedRegex = /<updated>([\s\S]*?)<\/updated>/;
      const updatedMatch = entry.match(updatedRegex);
      const updatedStr = updatedMatch ? updatedMatch[1].trim() : null;
      if (updatedStr) {
        try {
          const entryDate = new Date(updatedStr);
          parsedEntries.push({
            entry,
            date: entryDate,
            dateStr: updatedStr,
          });
        } catch (e) {
          console.warn(`Failed to parse Atom date: ${updatedStr}`);
        }
      }
    }
    // Sort by date (newest first)
    parsedEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
    const now = new Date();
    // Find the first entry that's not in the future
    let validEntry = null;
    for (const parsedEntry of parsedEntries) {
      if (parsedEntry.date <= now) {
        validEntry = parsedEntry;
        break;
      }
    }
    if (!validEntry) {
      return {
        status: "operational",
        lastIncident: null,
        lastIncidentDetails: null,
      };
    }
    // Extract title from the valid entry
    const titleRegex = /<title>([\s\S]*?)<\/title>/;
    const titleMatch = validEntry.entry.match(titleRegex);
    const title = titleMatch ? titleMatch[1].trim() : "";
    // Extract summary from the valid entry
    const summaryCDataRegex =
      /<summary[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/;
    const summaryRegex = /<summary[^>]*>([\s\S]*?)<\/summary>/;
    let summaryMatch = validEntry.entry.match(summaryCDataRegex);
    if (!summaryMatch) {
      summaryMatch = validEntry.entry.match(summaryRegex);
    }
    const summary = summaryMatch ? summaryMatch[1].trim() : "";
    // Check if incident is older than 24 hours
    const timeDiff = now.getTime() - validEntry.date.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    // If older than 24 hours, mark as operational
    if (hoursDiff > 24) {
      return {
        status: "operational",
        lastIncident: validEntry.date,
        lastIncidentDetails: null,
      };
    }
    // Within 24 hours - determine actual status
    const content = `${title} ${summary}`.toLowerCase();
    let status = "operational"; // default
    // Check for maintenance
    if (
      content.includes("maintenance") ||
      content.includes("scheduled") ||
      content.includes("planned") ||
      content.includes("upgrade")
    ) {
      if (
        content.includes("resolved") ||
        content.includes("completed") ||
        content.includes("fixed") ||
        content.includes("restored")
      ) {
        status = "operational";
      } else {
        status = "maintenance";
      }
    } else if (
      content.includes("outage") ||
      content.includes("incident") ||
      content.includes("disruption") ||
      content.includes("degraded") ||
      content.includes("investigating") ||
      content.includes("monitoring")
    ) {
      if (
        content.includes("resolved") ||
        content.includes("completed") ||
        content.includes("fixed") ||
        content.includes("restored")
      ) {
        status = "operational";
      } else {
        status = "incident";
      }
    } else if (
      content.includes("resolved") ||
      content.includes("completed") ||
      content.includes("fixed") ||
      content.includes("restored")
    ) {
      status = "operational";
    }
    // Extract components from summary (basic approach)
    const components = extractComponentsFromText(summary);

    // Determine incident status based on content
    const incidentStatus = determineIncidentStatus(content);

    // Create detailed incident object
    const incidentDetails = {
      title: title,
      description: stripHtml(summary),
      status: incidentStatus,
      createdAt: validEntry.dateStr,
      updatedAt: validEntry.dateStr,
      components: components,
    };

    return {
      status,
      lastIncident: validEntry.date,
      lastIncidentDetails: incidentDetails,
    };
  } catch (error) {
    console.warn(`Failed to parse Atom feed ${atomUrl}: ${error.message}`);
    return {
      status: "unknown",
      lastIncident: null,
      lastIncidentDetails: null,
    };
  }
}
// Fetch status via JSON API
async function fetchStatusFromAPI(apiUrl) {
  if (!apiUrl) return "unknown";
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${apiUrl}`);
    const json = await res.json();
    const indicator = json?.status?.indicator ?? "";
    const description = json?.status?.description ?? "";
    return normalizeStatus(`${indicator} ${description}`);
  } catch (e) {
    console.warn(`Failed API for ${apiUrl}: ${e.message}`);
    return "unknown";
  }
}
// Main function
Deno.serve(async (_req) => {
  console.log("Starting status update job...");
  // Get current statuses before updating
  const currentStatuses = await getCurrentStatuses();
  const statusChanges = [];
  // Process JSON services
  for (const service of services_json) {
    const status = await fetchStatusFromAPI(service.api);
    const incidentData = await fetchLatestIncident(service.incident_api);
    // Check for status change
    const oldStatus = currentStatuses.get(service.slug);
    if (oldStatus && oldStatus !== status) {
      statusChanges.push({
        service_slug: service.slug,
        service_name: service.name,
        old_status: oldStatus,
        new_status: status,
      });
    }
    await supabase.from("service_status").upsert({
      service_slug: service.slug,
      status,
      last_incident: incidentData.timestamp,
      last_incident_details: incidentData.details || null,
      updated_at: new Date(),
    });
  }
  // Process RSS feed services
  for (const service of services_rss) {
    const { status, lastIncident, lastIncidentDetails } = await parseRSSFeed(service.rss_url);
    // Check for status change
    const oldStatus = currentStatuses.get(service.slug);
    if (oldStatus && oldStatus !== status) {
      statusChanges.push({
        service_slug: service.slug,
        service_name: service.name,
        old_status: oldStatus,
        new_status: status,
      });
    }
    await supabase.from("service_status").upsert({
      service_slug: service.slug,
      status,
      last_incident: lastIncident,
      last_incident_details: lastIncidentDetails || null,
      updated_at: new Date(),
    });
  }
  // Process Atom feed services
  for (const service of services_atom) {
    const { status, lastIncident, lastIncidentDetails } = await parseAtomFeed(service.atom_url);
    // Check for status change
    const oldStatus = currentStatuses.get(service.slug);
    if (oldStatus && oldStatus !== status) {
      statusChanges.push({
        service_slug: service.slug,
        service_name: service.name,
        old_status: oldStatus,
        new_status: status,
      });
    }
    await supabase.from("service_status").upsert({
      service_slug: service.slug,
      status,
      last_incident: lastIncident,
      last_incident_details: lastIncidentDetails || null,
      updated_at: new Date(),
    });
  }
  // Only send notification if high-priority services changed
  if (statusChanges.length > 0 && shouldSendNotification(statusChanges)) {
    console.log(
      `Found ${statusChanges.length} status changes, including high-priority services`
    );
    // Get current incident services after updates
    const incidentServices = await getIncidentServices();
    // Filter to only show high-priority changes in the email
    const priorityChanges = statusChanges.filter((change) =>
      NOTIFICATION_TRIGGER_SERVICES.has(change.service_slug)
    );
    // Format and send email
    const subject = `High-Priority Service Alert: ${
      priorityChanges.length
    } Critical Service${priorityChanges.length > 1 ? "s" : ""} Updated`;
    const message = formatStatusChangeMessage(
      priorityChanges,
      incidentServices
    );
    await sendEmailNotification(subject, message);
  } else if (statusChanges.length > 0) {
    console.log(
      `Found ${statusChanges.length} status changes, but none are high-priority services`
    );
  } else {
    console.log("No status changes detected");
  }
  return new Response(
    JSON.stringify({
      success: true,
      totalChanges: statusChanges.length,
      priorityChanges: statusChanges.filter((change) =>
        NOTIFICATION_TRIGGER_SERVICES.has(change.service_slug)
      ).length,
      changes: statusChanges,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
});
