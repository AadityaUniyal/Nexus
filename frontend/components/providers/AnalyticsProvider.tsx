"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { initTracker, track } from "@/lib/analytics/tracker";

/** Tracks page views on route change and Core Web Vitals. */
export function AnalyticsProvider() {
  const pathname = usePathname();

  React.useEffect(() => {
    initTracker();
  }, []);

  React.useEffect(() => {
    if (pathname) track("page_view", { title: document.title.slice(0, 120) });
  }, [pathname]);

  useReportWebVitals((metric) => {
    if (["LCP", "CLS", "INP", "FCP", "TTFB"].includes(metric.name)) {
      track("web_vital", {
        metric: metric.name,
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        rating: (metric as { rating?: string }).rating ?? null,
      });
    }
  });

  return null;
}
