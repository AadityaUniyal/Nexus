export type SafeMapMarkerKind = "warehouse" | "vehicle" | "incident" | "location";

const markerPresentation: Record<SafeMapMarkerKind, { path: string; color: string; radius: string }> = {
  warehouse: {
    path: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1m-1 4h1m4-4h1m-1 4h1M9 21v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5",
    color: "#065F46",
    radius: "9px",
  },
  vehicle: {
    path: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    color: "#0284C7",
    radius: "50%",
  },
  incident: {
    path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    color: "#DC2626",
    radius: "50%",
  },
  location: {
    path: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    color: "#059669",
    radius: "50%",
  },
};

/**
 * Build map marker content with DOM APIs. Record labels are always assigned with
 * textContent and can never be interpreted as HTML.
 */
export function createSafeMapMarkerElement(
  doc: Document,
  kind: SafeMapMarkerKind,
  label: string,
  headingDegrees?: number,
): HTMLDivElement {
  const presentation = markerPresentation[kind];
  const marker = doc.createElement("div");
  marker.className = "nexus-map-marker group relative flex cursor-pointer flex-col items-center";
  marker.setAttribute("role", "img");
  marker.setAttribute("aria-label", label);

  const icon = doc.createElement("span");
  icon.className = "nexus-map-marker__icon relative flex items-center justify-center border-2 border-white text-white";
  icon.style.width = kind === "vehicle" || kind === "incident" ? "30px" : "32px";
  icon.style.height = kind === "vehicle" || kind === "incident" ? "30px" : "32px";
  icon.style.borderRadius = presentation.radius;
  icon.style.backgroundColor = presentation.color;
  icon.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.28)";

  if (kind === "vehicle" && Number.isFinite(headingDegrees)) {
    const normalizedHeading = ((headingDegrees as number) % 360 + 360) % 360;
    icon.style.transform = `rotate(${normalizedHeading}deg)`;
  }

  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", presentation.path);
  svg.appendChild(path);
  icon.appendChild(svg);
  marker.appendChild(icon);

  const tooltip = doc.createElement("span");
  tooltip.className = "nexus-map-marker__label pointer-events-none absolute bottom-full z-50 mb-1 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.textContent = label;
  marker.appendChild(tooltip);

  return marker;
}
