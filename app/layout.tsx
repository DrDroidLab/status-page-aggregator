import type { Metadata } from "next";
import "./globals.css";
import { TelemetryProvider } from "./components/TelemetryProvider";

export const metadata: Metadata = {
  title: {
    default: "Status Page Aggregator | Real-time Service Status Monitoring",
    template: "%s | Status Page Aggregator",
  },
  description:
    "Real-time status monitoring for popular cloud, AI, and infrastructure services. Check service status and join community discussions.",
  keywords: [
    "status page",
    "service status",
    "cloud status",
    "infrastructure monitoring",
    "AI services",
    "downtime monitoring",
  ],
  authors: [{ name: "Status Page Aggregator" }],
  creator: "Status Page Aggregator",
  publisher: "Status Page Aggregator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://drdroid.io/status-page-aggregator"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://drdroid.io/status-page-aggregator",
    title: "Status Page Aggregator | Real-time Service Status Monitoring",
    description:
      "Real-time status monitoring & alerting for popular cloud, AI, and infrastructure services. Check service status and find community links.",
    siteName: "Status Page Aggregator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Status Page Aggregator | Real-time Service Status Monitoring",
    description:
      "Real-time status monitoring & alerting for popular cloud, AI, and infrastructure services. Check service status and find community links.",
    creator: "@statuspageagg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body>
        {/* Initialize telemetry as early as possible */}
        <TelemetryProvider />
        {children}
      </body>
    </html>
  );
}
