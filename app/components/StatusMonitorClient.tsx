"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Github, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getStatusColor, getStatusText } from "@/lib/status";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import React, { useMemo, useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type ServiceStatus =
  | "operational"
  | "degraded"
  | "outage"
  | "incident"
  | "maintenance"
  | "unknown";

interface Service {
  name: string;
  status?: ServiceStatus;
  statusUrl: string;
  communityUrl: string;
  slug: string;
  tags: string[];
}

interface StatusMap {
  [key: string]: {
    status: ServiceStatus;
    last_incident?: {
      title: string;
      status: string;
      createdAt: string;
      htmlDescription: string;
    };
  };
}

function getTagColor(tag: string) {
  const colors: Record<string, string> = {
    Cloud: "bg-blue-100 text-blue-800",
    Infrastructure: "bg-purple-100 text-purple-800",
    "AI/ML": "bg-green-100 text-green-800",
    LLM: "bg-emerald-100 text-emerald-800",
    Productivity: "bg-yellow-100 text-yellow-800",
    "Project Management": "bg-orange-100 text-orange-800",
    Documentation: "bg-teal-100 text-teal-800",
    DevOps: "bg-indigo-100 text-indigo-800",
    "Version Control": "bg-violet-100 text-violet-800",
    Database: "bg-pink-100 text-pink-800",
    NoSQL: "bg-rose-100 text-rose-800",
    SQL: "bg-cyan-100 text-cyan-800",
    Cache: "bg-amber-100 text-amber-800",
    Backend: "bg-lime-100 text-lime-800",
    Serverless: "bg-sky-100 text-sky-800",
    Hosting: "bg-lime-100 text-lime-800",
    Monitoring: "bg-red-100 text-red-800",
    Email: "bg-teal-100 text-teal-800",
    CDN: "bg-violet-100 text-violet-800",
    "E-commerce": "bg-emerald-100 text-emerald-800",
    Security: "bg-rose-100 text-rose-800",
  };
  return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

export function StatusMonitorClient({
  services,
  statusMap,
}: {
  services: Service[];
  statusMap: StatusMap;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract all unique categories from tags
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => s.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [services]);

  // Get initial values from URL params
  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";

  // State for sorting and pagination (these don't need to be in URL)
  const [sortCol, setSortCol] = useState<string>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [displayCount, setDisplayCount] = useState(25);

  // Function to update URL params
  const updateUrlParams = (newSearch?: string, newCategory?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSearch !== undefined) {
      if (newSearch) {
        params.set("search", newSearch);
      } else {
        params.delete("search");
      }
    }

    if (newCategory !== undefined) {
      if (newCategory && newCategory !== "all") {
        params.set("category", newCategory);
      } else {
        params.delete("category");
      }
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Helper for status sort order
  function getStatusOrder(status: ServiceStatus) {
    if (status === "outage" || status === "degraded" || status == "incident")
      return 0; // incident
    if (status === "maintenance") return 1; // maintenance
    if (status === "operational") return 2;
    return 3; // unknown
  }

  // Helper for sharp status color
  function getSharpStatusColor(status: ServiceStatus) {
    switch (status) {
      case "operational":
        return "bg-green-600";
      case "degraded":
        return "bg-orange-500";
      case "outage":
        return "bg-red-600";
      case "incident":
        return "bg-red-600";
      case "maintenance":
        return "bg-blue-600";
      default:
        return "bg-gray-400";
    }
  }

  // Compose filtered and sorted services
  const filteredServices = useMemo(() => {
    let filtered = services;
    if (category !== "all") {
      filtered = filtered.filter((s) => s.tags.includes(category));
    }
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          (statusMap[s.slug]?.status || "unknown").toLowerCase().includes(q),
      );
    }
    // Attach computed status for sorting
    const withStatus = filtered.map((s) => ({
      ...s,
      computedStatus: statusMap[s.slug]?.status || "unknown",
      lastIncident: statusMap[s.slug]?.last_incident?.createdAt || null,
    }));
    // Sorting logic
    return withStatus.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "status") {
        // Primary sort: by status priority
        cmp =
          getStatusOrder(a.computedStatus) - getStatusOrder(b.computedStatus);

        // Secondary sort: if same status, sort by last incident (most recent first)
        if (cmp === 0) {
          if (a.lastIncident && b.lastIncident) {
            // Both have incidents - sort by most recent first (descending)
            cmp =
              new Date(b.lastIncident).getTime() -
              new Date(a.lastIncident).getTime();
          } else if (a.lastIncident) {
            // a has incident, b doesn't - a comes first
            cmp = -1;
          } else if (b.lastIncident) {
            // b has incident, a doesn't - b comes first
            cmp = 1;
          } else {
            // Neither has incidents - maintain current order
            cmp = 0;
          }
        }
      } else if (sortCol === "provider") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortCol === "lastIncident") {
        if (a.lastIncident && b.lastIncident) {
          cmp =
            new Date(a.lastIncident).getTime() -
            new Date(b.lastIncident).getTime();
        } else if (a.lastIncident) {
          cmp = -1;
        } else if (b.lastIncident) {
          cmp = 1;
        } else {
          cmp = 0;
        }
      } else if (sortCol === "tags") {
        cmp = a.tags.join(",").localeCompare(b.tags.join(","));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [services, statusMap, category, sortCol, sortDir, search]);

  // Get displayed services based on displayCount
  const displayedServices = useMemo(() => {
    return filteredServices.slice(0, displayCount);
  }, [filteredServices, displayCount]);

  // Check if there are more services to load
  const hasMoreServices = filteredServices.length > displayCount;

  // Load more handler
  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 25);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(25);
  }, [searchParams]);

  // Sort indicator
  const sortArrow = (col: string) =>
    sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  // Click handler for sorting
  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir(col === "status" ? "asc" : "asc"); // default direction
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}/logos/drdroid-logo.svg`}
                  alt="DrDroid Logo"
                  width={100}
                  height={100}
                  className="object-contain"
                />
                <h1 className="text-2xl font-bold text-primary"></h1>
              </div>
              <Badge variant="outline" className="text-xs">
                Open Source
              </Badge>
            </div>
            <div className="relative">
              {/* Sparkle animations */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -top-2 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
              <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
              <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-400 rounded-full animate-ping delay-500"></div>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="relative bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 hover:border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Link
                  href="https://github.com/DrDroidLab/status-page-aggregator"
                  className="flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800">
                  <Github className="w-4 h-4" />⭐ Star on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">Is It Down?</h2>
          <p className="text-xl text-muted-foreground mb-2">
            Real-time status monitoring for popular cloud, AI, and
            infrastructure services
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Built for engineers, by engineers. Check service status and find
            community links.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            <span>💡</span>
            <span>
              Setup 1 click automation to get Slack alert if any of them are
              down
            </span>
            <Link
              href="https://github.com/DrDroidLab/status-page-aggregator"
              className="underline hover:no-underline font-medium">
              Clone now
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-4">
          <Input
            className="w-64"
            placeholder="Search providers, tags, status..."
            value={search}
            onChange={(e) => updateUrlParams(e.target.value)}
          />
          <span className="font-medium">Filter by Category:</span>
          <Select
            value={category}
            onValueChange={(value) => updateUrlParams(undefined, value)}>
            <SelectTrigger className="w-56">
              <SelectValue>
                {category === "all" ? "All Categories" : category}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Services Table */}
        <div className="overflow-x-auto mb-12">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("provider")}>
                  Provider{sortArrow("provider")}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("status")}>
                  Status{sortArrow("status")}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("lastIncident")}>
                  Last Incident{sortArrow("lastIncident")}
                </TableHead>
                <TableHead>Links</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("tags")}>
                  Tags{sortArrow("tags")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedServices.map((service) => {
                const serviceStatus = service.computedStatus as ServiceStatus;
                return (
                  <TableRow key={service.slug}>
                    {/* Provider */}
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${getSharpStatusColor(
                            serviceStatus,
                          )}`}></span>
                        {getStatusText(serviceStatus)}
                      </span>
                    </TableCell>
                    {/* Last Incident */}
                    <TableCell>
                      {service.lastIncident ? (
                        new Date(service.lastIncident).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    {/* Links */}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/${service.slug}`}
                            className="flex items-center gap-2">
                            Details
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={service.statusUrl}
                            className="flex items-center gap-2"
                            target="_blank"
                            rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={service.communityUrl}
                            className="flex items-center gap-2"
                            target="_blank"
                            rel="noopener noreferrer">
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                    {/* Tags */}
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {service.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className={getTagColor(tag)}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Results Counter and Load More */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-4">
            Showing {displayedServices.length} of {filteredServices.length}{" "}
            services
          </p>
          {hasMoreServices && (
            <Button
              onClick={handleLoadMore}
              variant="outline"
              size="lg"
              className="px-8">
              Load More Services
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center">
          <Card className="w-fit">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Degraded</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Incident</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Maintenance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        {/* Built with Banner */}
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Built with:
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}/logos/cursor_logo.jpeg`}
                      alt="Cursor Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Cursor</div>
                    <div className="text-sm text-gray-600">
                      AI-powered code editor
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}/logos/v0_logo.png`}
                      alt="v0 Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">v0</div>
                    <div className="text-sm text-gray-600">
                      AI-model used in Cursor
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}/logos/vercel-icon-light.png`}
                      alt="Vercel Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Vercel</div>
                    <div className="text-sm text-gray-600">
                      Deployment & hosting
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}/logos/supabase_logo.jpg`}
                      alt="Supabase Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Supabase</div>
                    <div className="text-sm text-gray-600">
                      Database & backend
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 max-w-2xl mx-auto"></p>
            </div>
          </div>
        </div>

        {/* Original Footer Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              Made with ❤️ by the DrDroid team • Open source and community
              driven
            </p>
            <p className="mb-4">
              Want to add a service or report an issue?{" "}
              <Link
                href="https://github.com/DrDroidLab/status-page-aggregator"
                className="underline hover:no-underline">
                Contribute on GitHub
              </Link>
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <Link
                href="https://github.com/DrDroidLab/status-page-aggregator"
                className="hover:underline">
                🍴 Fork & Customize
              </Link>
              <Link
                href="https://github.com/DrDroidLab/status-page-aggregator/issues"
                className="hover:underline">
                🐛 Report Issues
              </Link>
              <Link
                href="https://github.com/DrDroidLab/status-page-aggregator/discussions"
                className="hover:underline">
                💬 Discussions
              </Link>
              <Link href="https://drdroid.io" className="hover:underline">
                🏠 DrDroid.io
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
