/**
 * ==============================================================================
 * NEXUS Neon Realtime & REST API Client
 * Enterprise-grade WebSocket client for Neon Realtime and REST PostgREST integration.
 * Adheres to Stripe & Shopify request/response contracts and error standards.
 * ==============================================================================
 */

export interface NeonRealtimeConfig {
  wsUrl?: string;
  httpUrl?: string;
  secretKey?: string;
  restApiUrl?: string;
  reconnectMaxAttempts?: number;
  heartbeatIntervalMs?: number;
}

export interface NeonSubscriptionMessage<T = unknown> {
  topic: string;
  event: string;
  payload: T;
  timestamp: string;
}

export interface NeonStandardResponse<T = unknown> {
  object: "list" | "item" | "event";
  data: T;
  has_more?: boolean;
  total_count?: number;
  api_version: string;
  request_id: string;
}

export interface NeonApiError {
  error: {
    type: "authentication_error" | "invalid_request_error" | "api_error" | "rate_limit_error";
    code: string;
    message: string;
    param?: string | null;
    doc_url?: string;
  };
}

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_NEON_REALTIME_WS_URL ||
  "wss://br-lucky-wildflower-a5249olo-neonrealtimesocket.compute.c-1.us-east-2.aws.neon.tech/";

const DEFAULT_SECRET_KEY =
  process.env.NEXT_PUBLIC_NEON_REALTIME_SECRET_KEY ||
  "nrt_live_1CAkLPdW1svFrHe1twL5IOU15hF7bue1tXwAjR3LpPSY";

const DEFAULT_REST_URL =
  process.env.NEXT_PUBLIC_NEON_REST_API_URL ||
  "https://ep-odd-unit-a5udqzav.apirest.us-east-2.aws.neon.tech/neondb/rest/v1";

export class NeonRealtimeSocket {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private secretKey: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs: number;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  constructor(config?: NeonRealtimeConfig) {
    this.wsUrl = config?.wsUrl || DEFAULT_WS_URL;
    this.secretKey = config?.secretKey || DEFAULT_SECRET_KEY;
    this.maxReconnectAttempts = config?.reconnectMaxAttempts ?? 10;
    this.heartbeatIntervalMs = config?.heartbeatIntervalMs ?? 30000;
  }

  public connect(): void {
    if (typeof window === "undefined" || this.ws) return;

    try {
      // Connect to the Neon Realtime socket with auth token in protocol or query params
      const urlWithAuth = new URL(this.wsUrl);
      urlWithAuth.searchParams.set("apikey", this.secretKey);

      this.ws = new WebSocket(urlWithAuth.toString(), ["neon-realtime", `auth-${this.secretKey}`]);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionState(true);
        this.startHeartbeat();

        // Send initial authorization handshake payload
        this.send({
          type: "auth",
          token: this.secretKey,
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingMessage(payload);
        } catch {
          // Plaintext keepalive or ack
        }
      };

      this.ws.onclose = () => {
        this.cleanup();
        this.notifyConnectionState(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn("[Neon Realtime] WebSocket connection notice:", err);
      };
    } catch (err) {
      console.warn("[Neon Realtime] WebSocket initialization skipped or unavailable:", err);
      this.notifyConnectionState(false);
    }
  }

  public subscribe<T = any>(topic: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
      // Inform server of subscription
      if (this.isConnected) {
        this.send({ type: "subscribe", topic });
      }
    }

    this.listeners.get(topic)!.add(callback);

    // If not connected yet, initiate connection
    if (!this.isConnected && !this.ws) {
      this.connect();
    }

    return () => {
      const topicListeners = this.listeners.get(topic);
      if (topicListeners) {
        topicListeners.delete(callback);
        if (topicListeners.size === 0) {
          this.listeners.delete(topic);
          if (this.isConnected) {
            this.send({ type: "unsubscribe", topic });
          }
        }
      }
    };
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    callback(this.isConnected);
    return () => this.connectionListeners.delete(callback);
  }

  public send(data: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleIncomingMessage(msg: any): void {
    const topic = msg.topic || msg.channel || msg.type || "default";
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach((listener) => listener(msg.payload || msg.data || msg));
    }
    // Also broadcast to wildcard listeners
    const wildcard = this.listeners.get("*");
    if (wildcard) {
      wildcard.forEach((listener) => listener(msg));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "ping", timestamp: Date.now() });
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanup(): void {
    this.isConnected = false;
    this.stopHeartbeat();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000 + Math.random() * 500);
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private notifyConnectionState(connected: boolean): void {
    this.connectionListeners.forEach((cb) => cb(connected));
  }
}

/**
 * Neon REST API Client (PostgREST contract with Stripe error formatting)
 */
export class NeonRestClient {
  private baseUrl: string;
  private secretKey: string;

  constructor(config?: { baseUrl?: string; secretKey?: string }) {
    this.baseUrl = (config?.baseUrl || DEFAULT_REST_URL).replace(/\/$/, "");
    this.secretKey = config?.secretKey || DEFAULT_SECRET_KEY;
  }

  public async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: NeonApiError["error"] | null }> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: this.secretKey,
      Authorization: `Bearer ${this.secretKey}`,
      "Nexus-Version": "2026-10-01",
      ...(options.headers as Record<string, string>),
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          data: null,
          error: {
            type: res.status === 401 || res.status === 403 ? "authentication_error" : "invalid_request_error",
            code: json?.code || `http_${res.status}`,
            message: json?.message || `Neon REST API error: ${res.statusText}`,
            doc_url: "https://neon.tech/docs/guides/api",
          },
        };
      }

      return { data: json as T, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          type: "api_error",
          code: "network_failure",
          message: err?.message || "Failed to reach Neon REST endpoint",
          doc_url: "https://neon.tech/docs",
        },
      };
    }
  }
}

// Singleton instances
export const neonRealtime = new NeonRealtimeSocket();
export const neonRest = new NeonRestClient();
