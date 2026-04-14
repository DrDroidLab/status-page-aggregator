"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrendsData {
  months: string[];
  total: { month: string; count: number }[];
  byProvider: {
    slug: string;
    total: number;
    counts: number[];
  }[];
}

// Nice display names for slugs
const DISPLAY_NAMES: Record<string, string> = {
  openai: "OpenAI", cursor: "Cursor", anthropic: "Anthropic",
  github: "GitHub", discord: "Discord", cloudflare: "Cloudflare",
  supabase: "Supabase", vercel: "Vercel", twilio: "Twilio",
  sendgrid: "SendGrid", "stripe-checkout": "Stripe", jira: "Jira",
  confluence: "Confluence", bitbucket: "Bitbucket", trello: "Trello",
  snowflake: "Snowflake", redis: "Redis", "mongodb-atlas": "MongoDB Atlas",
  digitalocean: "DigitalOcean", linode: "Linode", cohere: "Cohere",
  replicate: "Replicate", chargebee: "Chargebee", mailgun: "Mailgun",
  telnyx: "Telnyx", upstash: "Upstash",
};

function displayName(slug: string): string {
  return (
    DISPLAY_NAMES[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-US",
    { month: "short", year: "2-digit" }
  );
}

// Distinct colors for top providers
const PROVIDER_COLORS = [
  "#9554ff", "#3b82f6", "#ef4444", "#f59e0b", "#10b981",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899",
];

type ViewMode = "total" | "top5" | string; // string = specific provider slug

export function DowntimeTrendsChart() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("total");
  const [months, setMonths] = useState("6");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/incidents/trends?months=${months}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [months]);

  const chartData = useMemo(() => {
    if (!data) return [];

    if (viewMode === "total") {
      return data.total.map((item) => ({
        month: formatMonth(item.month),
        Incidents: item.count,
      }));
    }

    if (viewMode === "top5") {
      const top5 = data.byProvider.slice(0, 5);
      return data.months.map((m, idx) => {
        const entry: Record<string, string | number> = {
          month: formatMonth(m),
        };
        for (const p of top5) {
          entry[displayName(p.slug)] = p.counts[idx] ?? 0;
        }
        return entry;
      });
    }

    // Specific provider
    const provider = data.byProvider.find((p) => p.slug === viewMode);
    if (!provider) return [];
    return data.months.map((m, idx) => ({
      month: formatMonth(m),
      Incidents: provider.counts[idx] ?? 0,
    }));
  }, [data, viewMode]);

  const top5Providers = useMemo(
    () => (data?.byProvider ?? []).slice(0, 5),
    [data]
  );

  const totalIncidents = useMemo(
    () => data?.total.reduce((a, b) => a + b.count, 0) ?? 0,
    [data]
  );

  const providerOptions = useMemo(
    () => (data?.byProvider ?? []).slice(0, 20),
    [data]
  );

  const barKeys =
    viewMode === "top5"
      ? top5Providers.map((p) => displayName(p.slug))
      : ["Incidents"];

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">
              Downtime Trends
            </CardTitle>
            {!loading && data && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalIncidents} incidents tracked across{" "}
                {data.byProvider.length} providers
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={months} onValueChange={(v) => { setMonths(v); setViewMode("total"); }}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 mo</SelectItem>
                <SelectItem value="6">Last 6 mo</SelectItem>
                <SelectItem value="12">Last 12 mo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">All providers (total)</SelectItem>
                <SelectItem value="top5">Top 5 providers</SelectItem>
                {providerOptions.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {displayName(p.slug)} ({p.total})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : !data || totalIncidents === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-sm">No incident data yet.</p>
            <p className="text-xs">Run the backfill script to seed historical data.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="30%"
            >
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                }}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              {viewMode === "top5" && (
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              )}
              {barKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={PROVIDER_COLORS[i % PROVIDER_COLORS.length]}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
