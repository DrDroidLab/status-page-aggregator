"use client";
import { useEffect, useState, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Github, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  fetchServiceStatus,
  getStatusColor,
  getStatusText,
  type ServiceStatus,
} from "@/lib/status";
import { supabase } from "@/lib/supabase";
import { StatusMonitorClient } from "./components/StatusMonitorClient";
import {
  servicesCatalog as services,
  type CatalogService as Service,
} from "@/lib/servicesCatalog";

// ServiceStatus type is imported from @/lib/status

interface StatusMap {
  [key: string]: {
    status: ServiceStatus;
    last_incident?: {
      createdAt: string;
    };
  };
}

// Services list: @/lib/servicesCatalog
function StatusIndicator({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
      case "incident":
        return "bg-yellow-500";
      case "outage":
        return "bg-red-500";
      case "maintenance":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`} />;
}

function getTagColor(tag: string) {
  const colors = {
    Cloud: "bg-blue-100 text-blue-800",
    Infrastructure: "bg-gray-100 text-gray-800",
    "AI/ML": "bg-purple-100 text-purple-800",
    LLM: "bg-indigo-100 text-indigo-800",
    Database: "bg-green-100 text-green-800",
    DevOps: "bg-orange-100 text-orange-800",
    Payments: "bg-yellow-100 text-yellow-800",
    Communication: "bg-pink-100 text-pink-800",
    Productivity: "bg-cyan-100 text-cyan-800",
    Monitoring: "bg-red-100 text-red-800",
    Email: "bg-teal-100 text-teal-800",
    CDN: "bg-violet-100 text-violet-800",
    "E-commerce": "bg-emerald-100 text-emerald-800",
    Hosting: "bg-lime-100 text-lime-800",
    Security: "bg-rose-100 text-rose-800",
  };
  return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

function StatusMonitor() {
  const [statusRows, setStatusRows] = useState<any[] | null>(null);
  const [error, setError] = useState<any>(null);
  const [statusMap, setStatusMap] = useState<Record<string, any>>({});

  useEffect(() => {
    // Debug: Log environment variables (they will be undefined in the browser due to NEXT_PUBLIC_ prefix)
    console.log(
      "Supabase URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 10) + "...",
    );
    console.log(
      "Supabase Key exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    // Fetch statuses from Supabase (+ live cloud fallback when rows missing)
    const fetchStatuses = async () => {
      const { data, error } = await supabase.from("service_status").select("*");
      setStatusRows(data);
      setError(error);

      const { applyCanonicalAliasesToStatusMap } = await import(
        "@/lib/enrichStatusMap"
      );

      let statusMap = (data || []).reduce(
        (acc: Record<string, any>, row: any) => {
          acc[row.service_slug] = {
            status: row.status,
            last_incident: row.last_incident
              ? {
                  createdAt: row.last_incident,
                }
              : undefined,
          };
          return acc;
        },
        {} as Record<string, any>,
      );

      const cloudCanonicals = ["aws", "google-cloud", "azure"] as const;
      const missingCloud = cloudCanonicals.filter((s) => !statusMap[s]);

      if (missingCloud.length > 0) {
        try {
          const base = process.env.NEXT_PUBLIC_BASE_URL || "";
          const res = await fetch(`${base}/api/cloud-status`, {
            cache: "no-store",
          });
          if (res.ok) {
            const live = await res.json();
            for (const slug of missingCloud) {
              const row = live.providers?.[slug];
              if (row) statusMap[slug] = row;
            }
          }
        } catch (e) {
          console.warn("[status] cloud live fallback failed:", e);
        }
      }

      statusMap = applyCanonicalAliasesToStatusMap(
        statusMap,
        services.map((s) => s.slug),
      );
      setStatusMap(statusMap);
    };
    fetchStatuses();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading status dashboard...</p>
          </div>
        </div>
      }>
      <StatusMonitorClient services={services} statusMap={statusMap} />
    </Suspense>
  );
}

export default StatusMonitor;
