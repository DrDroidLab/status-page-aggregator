import { XMLParser } from "fast-xml-parser";

export type ServiceStatus =
  | "operational"
  | "degraded"
  | "outage"
  | "unknown"
  | "incident"
  | "maintenance";

export interface StatusIncident {
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  createdAt: string;
  updatedAt: string;
  components: string[];
  htmlDescription: string;
}

export interface ServiceStatusData {
  status: ServiceStatus;
  lastIncident?: StatusIncident;
  incidents: StatusIncident[];
}

export function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case "operational":
      return "bg-green-100 text-green-800";
    case "degraded":
      return "bg-orange-100 text-orange-800";
    case "incident":
      return "bg-red-100 text-red-800";
    case "outage":
      return "bg-red-100 text-red-800";
    case "maintenance":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusText(status: ServiceStatus): string {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "outage":
      return "Major Outage";
    case "incident":
      return "Incident";
    case "maintenance":
      return "Maintenance";
    default:
      return "Unknown";
  }
}

export async function fetchServiceStatus(
  rssUrl: string
): Promise<ServiceStatusData> {
  try {
    const response = await fetch(rssUrl, {
      next: { revalidate: 300 },
      cache: "no-store",
    }); // Cache for 5 minutes
    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "__text",
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
    });

    const result = parser.parse(xmlText);
    const items = result.rss.channel.item || [];

    // Process incidents
    const incidents: StatusIncident[] = items.map((item: any) => {
      // Handle CDATA content
      const description = item.description?.__cdata || item.description || "";
      const title = item.title?.__cdata || item.title || "";

      return {
        title: title,
        description: stripHtml(description), // Plain text version
        htmlDescription: description, // Keep HTML version
        status: determineIncidentStatus(description),
        createdAt: item.pubDate,
        updatedAt: item.pubDate,
        components: extractComponents(description),
      };
    });

    // Sort incidents by date (newest first)
    incidents.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    // Determine overall status using Deno script logic
    const status = determineOverallStatusFromFeed(incidents);

    return {
      status,
      lastIncident: incidents[0],
      incidents,
    };
  } catch (error) {
    console.error("Error fetching service status:", error);
    return {
      status: "unknown",
      incidents: [],
    };
  }
}

export async function fetchServiceStatusFromAtom(
  atomUrl: string
): Promise<ServiceStatusData> {
  try {
    const response = await fetch(atomUrl, {
      next: { revalidate: 300 },
      cache: "no-store",
    }); // Cache for 5 minutes
    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "__text",
      parseTagValue: false, // Keep as strings to preserve HTML entities
      parseAttributeValue: true,
      trimValues: true,
    });

    const result = parser.parse(xmlText);

    // Handle both single entry and array of entries
    let entryData = result.feed?.entry || [];
    if (!Array.isArray(entryData)) {
      entryData = [entryData];
    }

    // Process incidents from Atom entries
    const incidents: StatusIncident[] = entryData.map((entry: any) => {
      // Handle different content structures in Atom feeds
      const content =
        entry.content?.__cdata || entry.content?.__text || entry.content || "";
      const summary =
        entry.summary?.__cdata || entry.summary?.__text || entry.summary || "";
      const title =
        entry.title?.__cdata || entry.title?.__text || entry.title || "";

      // For Google Cloud, prioritize summary over content
      const description = summary || content;

      // Handle different date formats in Atom
      const publishDate = entry.published || entry.updated || "";
      const updateDate = entry.updated || entry.published || "";

      return {
        title: title,
        description: stripHtml(description), // Plain text version
        htmlDescription: description, // Keep HTML version
        status: determineIncidentStatus(description),
        createdAt: publishDate,
        updatedAt: updateDate,
        components: extractComponents(description),
      };
    });

    // Sort incidents by date (newest first)
    incidents.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    // Determine overall status using Deno script logic
    const status = determineOverallStatusFromFeed(incidents);

    return {
      status,
      lastIncident: incidents[0],
      incidents,
    };
  } catch (error) {
    console.error("Error fetching service status from Atom feed:", error);
    return {
      status: "unknown",
      incidents: [],
    };
  }
}

export async function fetchServiceStatusFromAPI(
  statusApiUrl: string,
  incidentsApiUrl: string
): Promise<ServiceStatusData> {
  try {
    // Fetch both status and incidents in parallel
    const [statusResponse, incidentsResponse] = await Promise.all([
      fetch(statusApiUrl, {
        next: { revalidate: 300 },
        cache: "no-store",
      }),
      fetch(incidentsApiUrl, {
        next: { revalidate: 300 },
        cache: "no-store",
      }),
    ]);

    const [statusData, incidentsData] = await Promise.all([
      statusResponse.json(),
      incidentsResponse.json(),
    ]);

    // Parse overall status
    const overallStatus = parseStatusFromAPI(statusData);

    // Parse incidents
    const incidents: StatusIncident[] = (incidentsData.incidents || []).map(
      (incident: any) => parseIncidentFromAPI(incident)
    );

    // Sort incidents by date (newest first)
    incidents.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    return {
      status: overallStatus,
      lastIncident: incidents[0],
      incidents,
    };
  } catch (error) {
    console.error("Error fetching service status from API:", error);
    return {
      status: "unknown",
      incidents: [],
    };
  }
}

export async function fetchServiceStatusFromBetterStack(
  jsonApiUrl: string,
  rssUrl?: string
): Promise<ServiceStatusData> {
  try {
    // Fetch the Better Stack JSON API
    const response = await fetch(jsonApiUrl, {
      next: { revalidate: 300 },
      cache: "no-store",
    });

    const data = await response.json();

    // Parse overall status from aggregate_state
    const overallStatus = normalizeBetterStackStatus(
      data?.data?.attributes?.aggregate_state || "unknown"
    );

    // Create incidents from RSS feed (if available)
    let incidents: StatusIncident[] = [];

    if (rssUrl) {
      try {
        const rssResponse = await fetch(rssUrl, {
          next: { revalidate: 300 },
          cache: "no-store",
        });
        const xmlText = await rssResponse.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
          textNodeName: "__text",
          parseTagValue: true,
          parseAttributeValue: true,
          trimValues: true,
        });

        const rssResult = parser.parse(xmlText);
        const items = rssResult.rss?.channel?.item || [];

        incidents = items.map((item: any) => {
          const description = item.description?.__cdata || item.description || "";
          const title = item.title?.__cdata || item.title || "";

          return {
            title: title,
            description: stripHtml(description),
            htmlDescription: description,
            status: determineIncidentStatus(description),
            createdAt: item.pubDate,
            updatedAt: item.pubDate,
            components: extractComponents(description),
          };
        });
      } catch (rssError) {
        console.warn("Failed to fetch RSS incidents:", rssError);
      }
    }

    // Sort incidents by date (newest first)
    incidents.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return {
      status: overallStatus,
      lastIncident: incidents[0],
      incidents: incidents.slice(0, 10), // Limit to most recent 10 incidents
    };
  } catch (error) {
    console.error("Error fetching service status from Better Stack:", error);
    return {
      status: "unknown",
      incidents: [],
    };
  }
}

function stripHtml(html: string): string {
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

function determineIncidentStatus(
  description: string
): StatusIncident["status"] {
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes("resolved")) return "resolved";
  if (lowerDesc.includes("monitoring")) return "monitoring";
  if (lowerDesc.includes("identified")) return "identified";
  return "investigating";
}

function determineOverallStatus(incidents: StatusIncident[]): ServiceStatus {
  if (incidents.length === 0) return "operational";

  const lastIncident = incidents[0];
  if (!lastIncident) return "operational";

  // Check if the last incident was more than 24 hours ago
  const lastIncidentTime = new Date(lastIncident.createdAt).getTime();
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  if (lastIncidentTime < twentyFourHoursAgo) {
    return "operational";
  }

  // If the incident is within 24 hours, check the text content
  const incidentText = (
    lastIncident.title +
    " " +
    lastIncident.description
  ).toLowerCase();

  // Words that indicate operational status
  const operationalKeywords = [
    "resolved",
    "functional",
    "operational",
    "fixed",
    "restored",
    "completed",
    "working",
    "normal",
    "stable",
    "healthy",
    "available",
  ];

  // Words that indicate degraded performance
  const degradedKeywords = [
    "partial outage",
    "degraded",
    "slow",
    "delayed",
    "intermittent",
    "some users",
    "limited",
    "reduced performance",
    "partial",
  ];

  // Words that indicate incidents (including outages)
  const incidentKeywords = [
    // General incident keywords
    "incident",
    "disruption",
    "investigating",
    "monitoring",
    "identified",
    "continuing to work",
    "partial fix",
    "working towards",
    "top priority",
    "still experience",
    "feature disruption",
    "issue",
    // Outage keywords (treated as incidents)
    "outage",
    "down",
    "unavailable",
    "offline",
    "major",
    "critical",
    "complete failure",
    "total",
    "service disruption",
  ];

  // Words that indicate maintenance
  const maintenanceKeywords = [
    "maintenance",
    "scheduled maintenance",
    "planned maintenance",
    "system maintenance",
    "routine maintenance",
    "maintenance window",
    "maintenance period",
    "scheduled downtime",
    "planned downtime",
    "upgrade",
    "system upgrade",
    "scheduled update",
    "planned update",
  ];

  // Check for maintenance keywords first
  if (maintenanceKeywords.some((keyword) => incidentText.includes(keyword))) {
    return "maintenance";
  }

  // Check for incident keywords (including outages)
  if (incidentKeywords.some((keyword) => incidentText.includes(keyword))) {
    return "incident";
  }

  // Check for resolved/operational keywords - but only if no incident keywords are present
  if (operationalKeywords.some((keyword) => incidentText.includes(keyword))) {
    // Double-check that this isn't actually an ongoing incident
    if (!incidentKeywords.some((keyword) => incidentText.includes(keyword))) {
      return "operational";
    }
  }

  // Check for degraded keywords
  if (degradedKeywords.some((keyword) => incidentText.includes(keyword))) {
    return "degraded";
  }

  // Default to degraded if within 24 hours but no specific keywords found
  return "degraded";
}

function extractComponents(description: string): string[] {
  // Look for components in both HTML and plain text formats
  const componentsMatch = description.match(
    /(?:Affected components|Components affected)[^<]*<ul[^>]*>([\s\S]*?)<\/ul>/i
  );
  if (!componentsMatch) return [];

  const componentsText = componentsMatch[1];
  return componentsText
    .split(/<\/?li>/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("<") && !line.endsWith(">"))
    .map((line) => line.replace(/\(Operational\)/i, "").trim())
    .filter(Boolean);
}

function parseStatusFromAPI(statusData: any): ServiceStatus {
  // Handle different API response formats
  const indicator = statusData.status?.indicator ?? "";
  const description = statusData.status?.description ?? "";
  return normalizeStatus(`${indicator} ${description}`);
}

function parseIncidentFromAPI(incident: any): StatusIncident {
  // Get the latest incident update for the description
  const latestUpdate = incident.incident_updates?.[0];
  const description = latestUpdate?.body || incident.body || "";

  // Extract affected components
  const components =
    incident.components?.map((comp: any) => comp.name) ||
    latestUpdate?.affected_components?.map((comp: any) => comp.name) ||
    [];

  return {
    title: incident.name || incident.title || "Unknown Incident",
    description: stripHtml(description),
    htmlDescription: description,
    status: mapAPIStatusToIncidentStatus(incident.status),
    createdAt: incident.created_at || incident.created_at,
    updatedAt: incident.updated_at || incident.updated_at,
    components: components,
  };
}

function mapAPIStatusToIncidentStatus(
  status: string
): StatusIncident["status"] {
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

// Normalize text-based status values (from Deno script)
function normalizeStatus(text: string): ServiceStatus {
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

// Determine overall status from feed data (RSS/Atom) using Deno script logic
function determineOverallStatusFromFeed(
  incidents: StatusIncident[]
): ServiceStatus {
  if (incidents.length === 0) return "operational";

  const lastIncident = incidents[0];
  if (!lastIncident) return "operational";

  // Check if the last incident was more than 24 hours ago
  const lastIncidentTime = new Date(lastIncident.createdAt).getTime();
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  if (lastIncidentTime < twentyFourHoursAgo) {
    return "operational";
  }

  // Within 24 hours - determine actual status using Deno script logic
  const content =
    `${lastIncident.title} ${lastIncident.description}`.toLowerCase();
  let status: ServiceStatus = "operational"; // default

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

  return status;
}

// Normalize Better Stack status values
function normalizeBetterStackStatus(status: string): ServiceStatus {
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case "operational":
      return "operational";
    case "degraded":
      return "degraded";
    case "partial_outage":
    case "partial outage":
      return "degraded";
    case "major_outage":
    case "major outage":
    case "outage":
      return "outage";
    case "incident":
      return "incident";
    case "maintenance":
      return "maintenance";
    default:
      return "unknown";
  }
}
