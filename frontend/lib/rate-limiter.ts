/**
 * NEXUS High-Performance In-Memory Sliding-Window Rate Limiter
 * Provides multi-tier rate limiting for standard API calls, AI inference, and simulation executions.
 */

export interface RateLimitConfig {
  windowMs: number; // Duration of window in milliseconds
  maxRequests: number; // Max allowed requests per window
  tierName?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSec: number;
}

// Preset rate limit tiers for NEXUS
export const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
    tierName: "Standard API Tier",
  },
  simulation: {
    windowMs: 60 * 1000,
    maxRequests: 40,
    tierName: "Simulation Engine Tier",
  },
  ai_inference: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    tierName: "Groq AI Inference Tier",
  },
  telemetry: {
    windowMs: 60 * 1000,
    maxRequests: 300,
    tierName: "Real-time Telemetry Ingestion Tier",
  },
};

interface WindowEntry {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private cache: Map<string, WindowEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic garbage collection for expired rate limit keys every 2 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Check rate limit for a client identifier and specified tier
   */
  public check(clientId: string, tierKey: keyof typeof RATE_LIMIT_TIERS = "standard"): RateLimitResult {
    const config = RATE_LIMIT_TIERS[tierKey] || RATE_LIMIT_TIERS.standard;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const key = `${tierKey}:${clientId}`;

    let entry = this.cache.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.cache.set(key, entry);
    }

    // Filter out timestamps outside the active sliding window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const currentCount = entry.timestamps.length;
    const remaining = Math.max(0, config.maxRequests - currentCount - 1);
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetTimeMs = oldestTimestamp + config.windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    if (currentCount >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTimeMs,
        retryAfterSec,
      };
    }

    // Record this request timestamp
    entry.timestamps.push(now);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining,
      resetTimeMs,
      retryAfterSec: 0,
    };
  }

  /**
   * Helper to generate standard HTTP headers for rate limiting
   */
  public getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(result.resetTimeMs / 1000).toString(),
    };

    if (!result.allowed) {
      headers["Retry-After"] = result.retryAfterSec.toString();
    }

    return headers;
  }

  /**
   * Evict keys that have had no activity within 5 minutes
   */
  private cleanup(): void {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
        this.cache.delete(key);
      }
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

import { NextResponse } from "next/server";

/**
 * Extract client IP or authentication token from Next.js Request
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const auth = req.headers.get("authorization");
  if (auth) {
    return `auth:${auth.slice(-16)}`;
  }
  return "nexus-client-default";
}

/**
 * Enforce rate limit check and return early response if exceeded
 */
export function enforceRateLimit(
  req: Request,
  tier: keyof typeof RATE_LIMIT_TIERS = "standard"
): { limited: boolean; response?: NextResponse; headers: Record<string, string> } {
  const clientId = getClientIdentifier(req);
  const result = rateLimiter.check(clientId, tier);
  const headers = rateLimiter.getHeaders(result);

  if (!result.allowed) {
    const config = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.standard;
    const response = NextResponse.json(
      {
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        error: `Rate limit exceeded for ${config.tierName || tier}. Max ${config.maxRequests} requests per window.`,
        retryAfterSec: result.retryAfterSec,
      },
      {
        status: 429,
        headers,
      }
    );
    return { limited: true, response, headers };
  }

  return { limited: false, headers };
}
