import { NextRequest, NextResponse } from "next/server";
import { expandSlugQuery, resolveServiceSlug } from "@/lib/serviceSlugAliases";
import { supabase } from "@/lib/supabase";

/** Cloud / SaaS clients (e.g. aiops-v0). */
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY?.trim() || "";
/** On-prem DrDroid installs only — separate key for rotation and auditing. */
const ON_PREM_API_KEY = process.env.ON_PREM_API_KEY?.trim() || "";

const ALLOWED_API_KEYS = new Set(
  [EXTERNAL_API_KEY, ON_PREM_API_KEY].filter((key) => key.length > 0),
);

if (ALLOWED_API_KEYS.size === 0) {
  console.error(
    "Neither EXTERNAL_API_KEY nor ON_PREM_API_KEY is set. API authentication will fail.",
  );
}

function extractApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }

  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }

  return null;
}

function validateApiKey(request: NextRequest): boolean {
  if (ALLOWED_API_KEYS.size === 0) {
    return false;
  }

  const token = extractApiKeyFromRequest(request);
  return token !== null && ALLOWED_API_KEYS.has(token);
}

// Helper function to normalize service identifier to slug (case-insensitive)
function normalizeToSlug(identifier: string): string {
  // Convert to lowercase and replace spaces with hyphens
  return identifier.toLowerCase().trim().replace(/\s+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Invalid or missing API key. Please provide a valid API key in the 'Authorization: Bearer <key>' or 'X-API-Key' header.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { services: serviceIdentifiers } = body;

    if (
      !serviceIdentifiers ||
      !Array.isArray(serviceIdentifiers) ||
      serviceIdentifiers.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Please provide an array of service names or slugs in the 'services' field.",
          example: {
            services: ["openai", "supabase", "vercel"],
          },
          note: "Use service slugs (e.g., 'openai', 'supabase', 'vercel'). Service names will be converted to slugs automatically.",
        },
        { status: 400 },
      );
    }

    // Normalize identifiers and resolve aliases (e.g. microsoft-azure → azure)
    const slugs = serviceIdentifiers.map((id: string) =>
      resolveServiceSlug(normalizeToSlug(id)),
    );
    const querySlugs = expandSlugQuery(slugs);

    // Fetch statuses from Supabase for the requested services
    const { data, error } = await supabase
      .from("service_status")
      .select("service_slug, status, last_incident, last_incident_details, updated_at")
      .in("service_slug", querySlugs);

    if (error) {
      console.error("Error fetching service statuses:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch service statuses",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Create a map for quick lookup
    const statusMap = new Map(
      data?.map((row) => [row.service_slug, row]) || [],
    );

    // Build response with all requested services
    const lookupStatus = (canonicalSlug: string) => {
      for (const key of expandSlugQuery([canonicalSlug])) {
        const row = statusMap.get(key);
        if (row) return row;
      }
      return undefined;
    };

    const results = serviceIdentifiers.map(
      (identifier: string, index: number) => {
        const requestedSlug = normalizeToSlug(identifier);
        const canonicalSlug = slugs[index];
        const statusData = lookupStatus(canonicalSlug);
        return {
          service: identifier,
          slug: requestedSlug,
          canonical_slug: canonicalSlug,
          status: statusData?.status || "unknown",
          last_incident: statusData?.last_incident || null,
          last_incident_details: statusData?.last_incident_details || null,
          updated_at: statusData?.updated_at || null,
          found: !!statusData,
        };
      },
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      services: results,
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
