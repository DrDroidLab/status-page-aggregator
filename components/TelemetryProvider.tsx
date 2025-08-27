"use client";

import { useEffect } from "react";
import { initTelemetry } from "@hyperlook/telemetry-sdk";

export default function TelemetryProvider() {
  useEffect(() => {
    const telemetry = initTelemetry({
      hyperlookApiKey: process.env.NEXT_PUBLIC_HYPERLOOK_API_KEY || "",
    });

    return () => {
      telemetry.destroy();
    };
  }, []);

  return null;
}
