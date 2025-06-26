import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the base URL for the API call
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : request.nextUrl.origin;

    // Call the check-incidents endpoint
    const response = await fetch(`${baseUrl}/api/check-incidents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Scheduled incident check completed",
      timestamp: new Date().toISOString(),
      checkResults: data,
    });
  } catch (error) {
    console.error("Error in scheduled check:", error);
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
