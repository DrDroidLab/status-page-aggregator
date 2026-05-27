import { NextResponse } from "next/server";
import {
  fetchServiceStatus,
  fetchServiceStatusFromAtom,
} from "@/lib/status";
import { statusMapEntryFromLive } from "@/lib/enrichStatusMap";

const CLOUD_FEEDS = {
  aws: {
    type: "rss" as const,
    url: "https://status.aws.amazon.com/rss/all.rss",
  },
  "google-cloud": {
    type: "atom" as const,
    url: "https://status.cloud.google.com/en/feed.atom",
  },
  azure: {
    type: "rss" as const,
    url: "https://azure.status.microsoft/en-us/status/feed/",
  },
};

/** Live fetch for core cloud providers when Supabase rows are missing. */
export async function GET() {
  try {
    const results: Record<
      string,
      ReturnType<typeof statusMapEntryFromLive>
    > = {};

    await Promise.all(
      Object.entries(CLOUD_FEEDS).map(async ([slug, feed]) => {
        const data =
          feed.type === "atom"
            ? await fetchServiceStatusFromAtom(feed.url)
            : await fetchServiceStatus(feed.url);

        results[slug] = statusMapEntryFromLive(
          data.status,
          data.lastIncident?.createdAt
            ? { createdAt: data.lastIncident.createdAt }
            : undefined,
        );
      }),
    );

    return NextResponse.json({
      success: true,
      source: "live-feed",
      updated_at: new Date().toISOString(),
      providers: results,
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
