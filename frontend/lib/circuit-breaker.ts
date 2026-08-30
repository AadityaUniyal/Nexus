/**
 * NEXUS Resilient Circuit Breaker
 * Protects platform integrations (Groq AI, IoT telemetry, Cloud Data Bridges) from cascading failures.
 * State machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before tripping (default: 4)
  recoveryTimeMs?: number; // Wait duration before trying HALF_OPEN (default: 15s)
  successThreshold?: number; // Successes in HALF_OPEN to close (default: 2)
  fallback?: <T>() => Promise<T> | T;
}

export class CircuitBreaker {
  public state: CircuitState = "CLOSED";
  public failureCount = 0;
  public successCount = 0;
  public lastStateChange: number = Date.now();
  private options: Required<Omit<CircuitBreakerOptions, "fallback">> & { fallback?: Function };

  constructor(public readonly name: string, options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 4,
      recoveryTimeMs: options.recoveryTimeMs ?? 15000,
      successThreshold: options.successThreshold ?? 2,
      fallback: options.fallback,
    };
  }

  /**
   * Execute an asynchronous action through the circuit breaker
   */
  public async execute<T>(action: () => Promise<T>, fallbackAction?: () => Promise<T> | T): Promise<T> {
    this.evaluateState();

    if (this.state === "OPEN") {
      if (fallbackAction) return await fallbackAction();
      if (this.options.fallback) return await this.options.fallback();
      throw new Error(`CircuitBreaker [${this.name}] is OPEN. Action rejected to protect downstream subsystem.`);
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      if (fallbackAction) return await fallbackAction();
      if (this.options.fallback) return await this.options.fallback();
      throw error;
    }
  }

  private evaluateState(): void {
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastStateChange;
      if (elapsed >= this.options.recoveryTimeMs) {
        this.transitionTo("HALF_OPEN");
        this.successCount = 0;
      }
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.transitionTo("CLOSED");
        this.failureCount = 0;
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  private onFailure(err: any): void {
    this.failureCount++;
    if (this.state === "HALF_OPEN" || this.failureCount >= this.options.failureThreshold) {
      this.transitionTo("OPEN");
    }
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = Date.now();
  }

  public getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastStateChange: new Date(this.lastStateChange).toISOString(),
    };
  }
}

// Global Breakers Registry
export const groqCircuitBreaker = new CircuitBreaker("GroqAIInference", {
  failureThreshold: 3,
  recoveryTimeMs: 20000,
});

export const iotHubCircuitBreaker = new CircuitBreaker("AzureIoTHubBridge", {
  failureThreshold: 5,
  recoveryTimeMs: 15000,
});

export const fabricDeltaCircuitBreaker = new CircuitBreaker("FabricOneLakeSync", {
  failureThreshold: 4,
  recoveryTimeMs: 30000,
});
