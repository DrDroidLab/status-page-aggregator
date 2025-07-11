// lib/TelemetryTracker.ts

// API Configuration
const TELEMETRY_API_URL = "http://20.51.107.130:8000/events/batch";

// Event Type Enum
export enum EventType {
  PAGE = "page",
  INTERACTION = "interaction",
  CONSOLE = "console",
  ERROR = "error",
  NETWORK = "network",
  SUPABASE = "supabase",
}

// Event Name Enum
export enum EventName {
  // Page events
  PAGE_LOAD = "page_load",
  PAGE_HIT = "page_hit",

  // Interaction events
  CLICK = "click",

  // Console events
  CONSOLE_LOG = "console_log",
  CONSOLE_WARN = "console_warn",
  CONSOLE_ERROR = "console_error",
  CONSOLE_INFO = "console_info",
  CONSOLE_DEBUG = "console_debug",

  // Error events
  JAVASCRIPT_ERROR = "javascript_error",
  UNHANDLED_PROMISE_REJECTION = "unhandled_promise_rejection",

  // Network events
  XHR_COMPLETE = "xhr_complete",
  XHR_ERROR = "xhr_error",
  FETCH_COMPLETE = "fetch_complete",
  FETCH_ERROR = "fetch_error",

  // Supabase events
  SUPABASE_XHR_COMPLETE = "supabase_xhr_complete",
  SUPABASE_XHR_ERROR = "supabase_xhr_error",
  SUPABASE_FETCH_COMPLETE = "supabase_fetch_complete",
  SUPABASE_FETCH_ERROR = "supabase_fetch_error",
}

export type TelemetryEvent = {
  event_id?: string;
  user_id?: string;
  session_id?: string;
  event_type: string;
  event_name: string;
  properties?: Record<string, any>;
  user_properties?: Record<string, any>;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
  timestamp?: string;
};

export class TelemetryTracker {
  private events: TelemetryEvent[] = [];
  private readonly bufferSize = 50;
  private readonly flushIntervalMs = 10_000;
  private flushTimerId?: ReturnType<typeof setInterval>;
  private isInitialized = false;
  private sessionId: string;

  private static instance: TelemetryTracker;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private generateSessionId(): string {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  private generateEventId(): string {
    return (
      "event_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  private initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.trackPageLoad();
      this.patchClicks();
      this.patchConsole();
      this.patchFetch();
      this.patchXHR();
      this.patchGlobalErrors();
      this.startFlushLoop();

      // Capture initial page hit
      this.capture(EventType.PAGE, EventName.PAGE_HIT, {
        viewport: {
          width: typeof window !== "undefined" ? window.innerWidth : 0,
          height: typeof window !== "undefined" ? window.innerHeight : 0,
          devicePixelRatio:
            typeof window !== "undefined" ? window.devicePixelRatio : 1,
        },
        characterSet:
          typeof document !== "undefined" ? document.characterSet : "",
        language: typeof navigator !== "undefined" ? navigator.language : "",
        cookieEnabled:
          typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
        onLine: typeof navigator !== "undefined" ? navigator.onLine : false,
        platform: typeof navigator !== "undefined" ? navigator.platform : "",
      });

      this.isInitialized = true;
      console.log(
        "[Telemetry] Successfully initialized with all tracking enabled",
      );
    } catch (error) {
      console.error("[Telemetry] Failed to initialize:", error);
    }
  }

  public static getInstance(): TelemetryTracker {
    if (!this.instance) {
      this.instance = new TelemetryTracker();
    }
    return this.instance;
  }

  private startFlushLoop() {
    console.log(
      "[Telemetry] Starting flush loop with interval:",
      this.flushIntervalMs,
      "ms",
    );
    this.flushTimerId = setInterval(() => {
      console.log(
        "[Telemetry] Flush timer triggered, events in buffer:",
        this.events.length,
      );
      this.flush();
    }, this.flushIntervalMs);
  }

  public capture(
    eventType: string,
    eventName: string,
    properties?: Record<string, any>,
    userProperties?: Record<string, any>,
  ) {
    const event: TelemetryEvent = {
      event_id: this.generateEventId(),
      session_id: this.sessionId,
      event_type: eventType,
      event_name: eventName,
      properties: properties || {},
      user_properties: userProperties || {},
      page_url:
        typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log("[Telemetry] Capturing event:", eventType, eventName, event);

    // Add to local buffer
    this.events.push(event);

    // Flush if buffer is full
    if (this.events.length >= this.bufferSize) {
      this.flush();
    }
  }

  public flush() {
    if (this.events.length === 0) return;

    console.log(
      "[Telemetry] Flushing",
      this.events.length,
      "events from TelemetryTracker",
    );

    // Send events directly to the API
    const payload = {
      batch: {
        events: this.events,
      },
    };

    // Send to external telemetry endpoint
    fetch(TELEMETRY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        console.log(
          "[Telemetry] Successfully sent",
          this.events.length,
          "events to API",
        );
      })
      .catch(function (err: any) {
        console.error("[Telemetry] Failed to send events:", err);
      });

    // Clear the events array
    this.events = [];
  }

  private trackPageLoad() {
    if (typeof window === "undefined") return;

    if (document.readyState === "complete") {
      this.capturePageLoadMetrics();
    } else {
      window.addEventListener("load", () => {
        this.capturePageLoadMetrics();
      });
    }
  }

  private capturePageLoadMetrics() {
    try {
      const t = performance.timing;
      const loadTime = t.loadEventEnd - t.navigationStart;
      const domContentLoaded = t.domContentLoadedEventEnd - t.navigationStart;
      const firstPaint = performance
        .getEntriesByType("paint")
        .find((entry) => entry.name === "first-paint")?.startTime;
      const firstContentfulPaint = performance
        .getEntriesByType("paint")
        .find((entry) => entry.name === "first-contentful-paint")?.startTime;

      this.capture(EventType.PAGE, EventName.PAGE_LOAD, {
        loadTime: loadTime,
        domContentLoaded: domContentLoaded,
        firstPaint: firstPaint,
        firstContentfulPaint: firstContentfulPaint,
        navigationStart: t.navigationStart,
        fetchStart: t.fetchStart,
        domainLookupStart: t.domainLookupStart,
        domainLookupEnd: t.domainLookupEnd,
        connectStart: t.connectStart,
        connectEnd: t.connectEnd,
        requestStart: t.requestStart,
        responseStart: t.responseStart,
        responseEnd: t.responseEnd,
        domLoading: t.domLoading,
        domInteractive: t.domInteractive,
        domContentLoadedEventStart: t.domContentLoadedEventStart,
        domContentLoadedEventEnd: t.domContentLoadedEventEnd,
        domComplete: t.domComplete,
        loadEventStart: t.loadEventStart,
        loadEventEnd: t.loadEventEnd,
        readyState: document.readyState,
        characterSet: document.characterSet,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        platform: navigator.platform,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
      });
    } catch (error) {
      console.error("Failed to capture page load metrics:", error);
    }
  }

  private patchClicks() {
    if (typeof document === "undefined") return;

    document.addEventListener(
      "click",
      (e) => {
        try {
          const tgt = e.target as HTMLElement;
          const rect = tgt.getBoundingClientRect();

          this.capture(EventType.INTERACTION, EventName.CLICK, {
            element: {
              tagName: tgt.tagName,
              id: tgt.id || null,
              className: tgt.className || null,
              textContent: tgt.textContent?.slice(0, 100) || null,
              href: (tgt as HTMLAnchorElement).href || null,
              type: (tgt as HTMLInputElement).type || null,
              value: (tgt as HTMLInputElement).value || null,
              placeholder: (tgt as HTMLInputElement).placeholder || null,
              role: tgt.getAttribute("role") || null,
              ariaLabel: tgt.getAttribute("aria-label") || null,
              dataAttributes: Object.fromEntries(
                Array.from(tgt.attributes)
                  .filter((attr) => attr.name.startsWith("data-"))
                  .map((attr) => [attr.name, attr.value]),
              ),
            },
            position: {
              x: e.clientX,
              y: e.clientY,
              pageX: e.pageX,
              pageY: e.pageY,
              screenX: e.screenX,
              screenY: e.screenY,
            },
            boundingRect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            },
            event: {
              button: e.button,
              buttons: e.buttons,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              altKey: e.altKey,
              metaKey: e.metaKey,
              type: e.type,
              timestamp: e.timeStamp,
            },
            scrollX: window.scrollX,
            scrollY: window.scrollY,
          });
        } catch (error) {
          console.error("Failed to capture click event:", error);
        }
      },
      true,
    );
  }

  private patchConsole() {
    if (typeof console === "undefined") return;

    (["log", "warn", "error", "info", "debug"] as const).forEach((method) => {
      const orig = console[method];
      console[method] = (...args: any[]) => {
        if (!args[0]?.toString().includes("[Telemetry]")) {
          let eventName: EventName;
          switch (method) {
            case "log":
              eventName = EventName.CONSOLE_LOG;
              break;
            case "warn":
              eventName = EventName.CONSOLE_WARN;
              break;
            case "error":
              eventName = EventName.CONSOLE_ERROR;
              break;
            case "info":
              eventName = EventName.CONSOLE_INFO;
              break;
            case "debug":
              eventName = EventName.CONSOLE_DEBUG;
              break;
            default:
              eventName = EventName.CONSOLE_LOG;
          }

          this.capture(EventType.CONSOLE, eventName, {
            message: args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : String(arg),
              )
              .join(" "),
            args: args.map((arg) => {
              if (typeof arg === "object") {
                try {
                  return JSON.stringify(arg);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            }),
            stack: new Error().stack?.split("\\n").slice(2, 7) || [],
          });
        }
        orig.apply(console, args);
      };
    });
  }

  private patchFetch() {
    if (typeof window === "undefined" || typeof window.fetch === "undefined") {
      console.log("[Telemetry] Fetch not available, skipping fetch patching");
      return;
    }

    console.log("[Telemetry] Patching fetch for telemetry tracking");
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url =
        typeof input === "string"
          ? input
          : input instanceof Request
          ? input.url
          : String(input);
      const method = init?.method || "GET";

      // Skip tracking telemetry API calls to prevent infinite loops
      if (url.includes("/api/telemetry") || url.includes(TELEMETRY_API_URL)) {
        console.log("[Telemetry] Skipping telemetry API call:", url);
        return originalFetch(input, init);
      }

      console.log("[Telemetry] Fetch request started:", method, url);
      const startTime = performance.now();
      const isSupabaseQuery =
        url.includes("supabase.co") || url.includes("supabase.com");

      try {
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(
          "[Telemetry] Fetch request completed:",
          method,
          url,
          response.status,
          "duration:",
          duration + "ms",
        );

        const eventName = isSupabaseQuery
          ? EventName.SUPABASE_FETCH_COMPLETE
          : EventName.FETCH_COMPLETE;
        const eventType = isSupabaseQuery
          ? EventType.SUPABASE
          : EventType.NETWORK;

        this.capture(eventType, eventName, {
          url,
          method,
          responseStatus: response.status,
          responseStatusText: response.statusText,
          duration,
          startTime,
          endTime,
          isSupabaseQuery,
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log("[Telemetry] Fetch request failed:", method, url, error);

        const eventName = isSupabaseQuery
          ? EventName.SUPABASE_FETCH_ERROR
          : EventName.FETCH_ERROR;
        const eventType = isSupabaseQuery
          ? EventType.SUPABASE
          : EventType.NETWORK;

        this.capture(eventType, eventName, {
          url,
          method,
          queryParams: this.extractQueryParams(url),
          duration,
          error: error instanceof Error ? error.message : String(error),
          startTime,
          endTime,
          isSupabaseQuery,
        });

        throw error;
      }
    };

    console.log("[Telemetry] Fetch patching completed successfully");
  }

  private patchGlobalErrors() {
    if (typeof window === "undefined") return;

    // Global error handler
    window.addEventListener("error", (event) => {
      this.capture(EventType.ERROR, EventName.JAVASCRIPT_ERROR, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.capture(EventType.ERROR, EventName.UNHANDLED_PROMISE_REJECTION, {
        reason: event.reason?.toString(),
        promise: event.promise,
      });
    });
  }

  private patchXHR() {
    if (typeof XMLHttpRequest === "undefined") return;

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string,
      async?: boolean,
      user?: string | null,
      password?: string | null,
    ) {
      (this as any)._url = url;
      (this as any)._method = method;
      (this as any)._startTime = performance.now();
      return origOpen.call(this, method, url, async ?? true, user, password);
    };

    XMLHttpRequest.prototype.send = function (
      this: XMLHttpRequest,
      body?: Document | XMLHttpRequestBodyInit | null,
    ) {
      const url = (this as any)._url;
      const method = (this as any)._method;
      const startTime = (this as any)._startTime;
      const isSupabaseQuery =
        url.includes("supabase.co") || url.includes("supabase.com");

      const onLoadEnd = async () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const status = this.status;

        try {
          const queryParams =
            TelemetryTracker.instance?.extractQueryParams(url) || {};
          const responseHeaders: Record<string, string> = {};
          const responseText = this.responseText;

          // Extract response headers
          const headerString = this.getAllResponseHeaders();
          if (headerString) {
            headerString.split("\\r\\n").forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) {
                responseHeaders[key.toLowerCase()] = value;
              }
            });
          }

          let responseBody = null;
          try {
            if (responseText) {
              responseBody = JSON.parse(responseText);
            }
          } catch {
            responseBody = responseText;
          }

          const eventName = isSupabaseQuery
            ? "supabase_xhr_complete"
            : "xhr_complete";
          const eventType = isSupabaseQuery ? "supabase" : "network";

          TelemetryTracker.instance?.capture(eventType, eventName, {
            url,
            method,
            queryParams,
            responseStatus: status,
            responseStatusText: this.statusText,
            responseHeaders,
            responseBody,
            duration,
            startTime,
            endTime,
            isSupabaseQuery,
          });
        } catch (error) {
          console.error("Failed to capture XHR event:", error);
        }

        cleanup();
      };

      const onError = () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const eventName = isSupabaseQuery ? "supabase_xhr_error" : "xhr_error";
        const eventType = isSupabaseQuery ? "supabase" : "network";

        TelemetryTracker.instance?.capture(eventType, eventName, {
          url,
          method,
          queryParams: TelemetryTracker.instance?.extractQueryParams(url) || {},
          duration,
          error: "XHR request failed",
          startTime,
          endTime,
          isSupabaseQuery,
        });
        cleanup();
      };

      const cleanup = () => {
        this.removeEventListener("loadend", onLoadEnd);
        this.removeEventListener("error", onError);
      };

      this.addEventListener("loadend", onLoadEnd);
      this.addEventListener("error", onError);

      return origSend.call(this, body);
    };
  }

  private extractQueryParams(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch (error) {
      return {};
    }
  }

  public destroy() {
    if (this.flushTimerId) {
      clearInterval(this.flushTimerId);
    }
    this.flush();
  }
}
