"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

function report(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  });
}

export function PerformanceMonitor() {
  const pathname = usePathname();

  useEffect(() => {
    report({ name: "PAGE_VIEW", path: pathname });
  }, [pathname]);

  useReportWebVitals((metric) => {
    report({
      name: metric.name,
      path: window.location.pathname,
      value: metric.value,
      rating: metric.rating
    });
  });

  return null;
}
