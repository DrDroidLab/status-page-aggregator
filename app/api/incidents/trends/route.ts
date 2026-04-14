import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // cache for 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service") ?? null;
  const monthsBack = Math.min(parseInt(searchParams.get("months") ?? "6"), 12);

  try {
    let query = supabase
      .from("service_incidents")
      .select("service_slug, status, recorded_at")
      .in("status", ["incident", "degraded", "outage", "maintenance"])
      .gte(
        "recorded_at",
        new Date(
          Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      )
      .order("recorded_at", { ascending: true });

    if (serviceSlug) {
      query = query.eq("service_slug", serviceSlug);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build month labels for the past N months
    const months: string[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7)); // "YYYY-MM"
    }

    // Aggregate: { [serviceSlug]: { [month]: count } }
    const byProvider: Record<string, Record<string, number>> = {};

    for (const row of data ?? []) {
      const month = row.recorded_at.slice(0, 7);
      if (!months.includes(month)) continue;
      if (!byProvider[row.service_slug]) byProvider[row.service_slug] = {};
      byProvider[row.service_slug][month] =
        (byProvider[row.service_slug][month] ?? 0) + 1;
    }

    // Build total per month
    const total: Record<string, number> = {};
    for (const monthData of Object.values(byProvider)) {
      for (const [month, count] of Object.entries(monthData)) {
        total[month] = (total[month] ?? 0) + count;
      }
    }

    // Sort providers by total incident count descending
    const sortedProviders = Object.entries(byProvider)
      .map(([slug, monthData]) => ({
        slug,
        total: Object.values(monthData).reduce((a, b) => a + b, 0),
        monthData,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      months,
      total: months.map((m) => ({ month: m, count: total[m] ?? 0 })),
      byProvider: sortedProviders.map(({ slug, total: providerTotal, monthData }) => ({
        slug,
        total: providerTotal,
        counts: months.map((m) => monthData[m] ?? 0),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
