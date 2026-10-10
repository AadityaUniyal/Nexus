/**
 * First-party product analytics client.
 * Batches events in memory and flushes to /api/v1/events/track every few
 * seconds, or via sendBeacon when the tab is hidden. No third-party scripts,
 * no cookies; IDs live in localStorage/sessionStorage.
 */
export type TrackEventName =
  | "page_view"
  | "session_start"
  | "click"
  | "feature_used"
  | "search"
  | "export"
  | "simulation_run"
  | "report_generated"
  | "ai_query"
  | "error"
  | "web_vital";

type Props = Record<string, string | number | boolean | null | undefined>;

interface QueuedEvent {
  name: TrackEventName;
  path: string;
  referrer?: string;
  anonymousId: string;
  sessionId: string;
  device: string;
  properties: Props;
  timestamp: string;
}

// Same-origin path: Next/Vercel rewrites /api/v1/* to the Azure backend, so no CORS preflight.
const ENDPOINT = "/api/v1/events/track";
const FLUSH_MS = 5000;
const MAX_BATCH = 25;
const SESSION_IDLE_MS = 30 * 60 * 1000;

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let initialised = false;

const isBrowser = () => typeof window !== "undefined";
const disabled = () => process.env.NEXT_PUBLIC_ANALYTICS_DISABLED === "true" || (isBrowser() && navigator.doNotTrack === "1");

function rid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `anon-${Date.now()}`;
}

function anonymousId(): string {
  try {
    let id = localStorage.getItem("nx_aid");
    if (!id) {
      id = rid();
      localStorage.setItem("nx_aid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function sessionId(): { id: string; isNew: boolean } {
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem("nx_sts") || 0);
    let id = sessionStorage.getItem("nx_sid");
    const isNew = !id || now - last > SESSION_IDLE_MS;
    if (isNew) {
      id = rid();
      sessionStorage.setItem("nx_sid", id);
    }
    sessionStorage.setItem("nx_sts", String(now));
    return { id: id as string, isNew };
  } catch {
    return { id: "session", isNew: false };
  }
}

function device(): string {
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

export function flush(useBeacon = false): void {
  if (!queue.length || !isBrowser()) return;
  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({ events });
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
  } else {
    fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {
      /* analytics must never break the app */
    });
  }
  if (queue.length) schedule();
}

function schedule() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_MS);
}

export function track(name: TrackEventName, properties: Props = {}): void {
  if (!isBrowser() || disabled()) return;
  const s = sessionId();
  if (s.isNew && name !== "session_start") {
    enqueue("session_start", {}, s.id);
  }
  enqueue(name, properties, s.id);
}

function enqueue(name: TrackEventName, properties: Props, sid: string) {
  queue.push({
    name,
    path: window.location.pathname,
    referrer: document.referrer ? document.referrer.slice(0, 255) : undefined,
    anonymousId: anonymousId(),
    sessionId: sid,
    device: device(),
    properties,
    timestamp: new Date().toISOString(),
  });
  if (queue.length >= MAX_BATCH) flush();
  else schedule();
}

/** Wire global listeners once: beacon on hide, delegated clicks on [data-track]. */
export function initTracker(): void {
  if (initialised || !isBrowser()) return;
  initialised = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (el) track("click", { target: el.dataset.track || "unknown" });
    },
    { capture: true, passive: true }
  );
  window.addEventListener("error", (e) => track("error", { message: String(e.message).slice(0, 180) }));
}
