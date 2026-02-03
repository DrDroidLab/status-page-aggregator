import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// API Key for authentication - read from environment variable
const API_KEY = process.env.EXTERNAL_API_KEY;

if (!API_KEY) {
  console.error(
    "EXTERNAL_API_KEY environment variable is not set. API authentication will fail.",
  );
}

// Helper function to validate API key from request headers
function validateApiKey(request: NextRequest): boolean {
  // If API key is not configured, reject all requests
  if (!API_KEY) {
    return false;
  }

  // Check for API key in Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token === API_KEY) {
      return true;
    }
  }

  // Check for API key in X-API-Key header
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader && apiKeyHeader === API_KEY) {
    return true;
  }

  return false;
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

    // Normalize all identifiers to slugs
    const slugs = serviceIdentifiers.map(normalizeToSlug);

    // Fetch statuses from Supabase for the requested services
    const { data, error } = await supabase
      .from("service_status")
      .select("service_slug, status, last_incident, last_incident_details, updated_at")
      .in("service_slug", slugs);

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
    const results = serviceIdentifiers.map(
      (identifier: string, index: number) => {
        const slug = slugs[index];
        const statusData = statusMap.get(slug);
        return {
          service: identifier,
          slug: slug,
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
