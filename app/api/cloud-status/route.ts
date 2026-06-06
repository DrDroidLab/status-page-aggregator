import { NextResponse } from "next/server";
import { statusMapEntryFromLive } from "@/lib/enrichStatusMap";
import { fetchLiveCloudStatus } from "@/lib/fetchLiveCloudStatus";

/** Live fetch for core cloud providers when Supabase rows are missing. */
export async function GET() {
  try {
    const live = await fetchLiveCloudStatus();
    const providers: Record<
      string,
      ReturnType<typeof statusMapEntryFromLive>
    > = {};

    for (const [slug, row] of live) {
      providers[slug] = statusMapEntryFromLive(
        row.status,
        row.last_incident ? { createdAt: row.last_incident } : undefined,
      );
    }

    return NextResponse.json({
      success: true,
      source: "live-feed",
      updated_at: new Date().toISOString(),
      providers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cloud-status]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
