"use client";

import { useEffect } from "react";
import { TelemetryTracker } from "../TelemetryTracker";

export function TelemetryProvider() {
  useEffect(() => {
    // Initialize telemetry tracking as early as possible
    try {
      console.log("TelemetryProvider: Initializing telemetry tracker...");
      const tracker = TelemetryTracker.getInstance();

      // Clean up on component unmount
      return () => {
        console.log("TelemetryProvider: Cleaning up telemetry tracker...");
        tracker.destroy();
      };
    } catch (error) {
      console.error(
        "TelemetryProvider: Failed to initialize telemetry:",
        error,
      );
    }
  }, []);

  return (
    <>
      {/* Inline script to initialize telemetry immediately */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Initialize telemetry as early as possible
                if (typeof window !== 'undefined' && !window.__telemetryInitialized) {
                  window.__telemetryInitialized = true;
                  console.log('[Telemetry] Early initialization started');
                  
                  // Create global buffer for compatibility
                  window.__telemetryBuffer = window.__telemetryBuffer || [];
                  
                  console.log('[Telemetry] Early initialization completed');
                }
              } catch (error) {
                console.error('[Telemetry] Early initialization failed:', error);
              }
            })();
          `,
        }}
      />
    </>
  );
}
