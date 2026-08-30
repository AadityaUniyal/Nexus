/**
 * NEXUS Distributed In-Memory Event Streaming & PubSub Bus
 * Decouples telemetry ingestion, incident notifications, and audit logging into an asynchronous pipeline.
 */

export interface NexusEventPayload<T = any> {
  id: string;
  topic: string;
  timestamp: string;
  correlationId?: string;
  data: T;
}

type EventHandler<T = any> = (event: NexusEventPayload<T>) => Promise<void> | void;

export class NexusEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private deadLetterQueue: NexusEventPayload[] = [];
  private eventHistory: NexusEventPayload[] = [];
  private maxHistory: number;

  constructor(maxHistory = 1000) {
    this.maxHistory = maxHistory;
  }

  /**
   * Subscribe to a specific topic or wildcard '*'
   */
  public subscribe<T = any>(topic: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);

    // Return unsubscribe callback
    return () => {
      const topicHandlers = this.handlers.get(topic);
      if (topicHandlers) {
        topicHandlers.delete(handler);
      }
    };
  }

  /**
   * Asynchronously publish an event to all subscribers with error isolation
   */
  public async publish<T = any>(topic: string, data: T, correlationId?: string): Promise<string> {
    const event: NexusEventPayload<T> = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      topic,
      timestamp: new Date().toISOString(),
      correlationId: correlationId || `corr-${Date.now()}`,
      data,
    };

    // Store in circular history buffer
    if (this.eventHistory.length >= this.maxHistory) {
      this.eventHistory.shift();
    }
    this.eventHistory.push(event);

    const subscribers = [
      ...(this.handlers.get(topic) || []),
      ...(this.handlers.get("*") || []),
    ];

    // Execute handlers concurrently without blocking the producer
    Promise.allSettled(
      subscribers.map(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          console.error(`[EventBus] Handler failure on topic ${topic}:`, err);
          this.deadLetterQueue.push(event);
        }
      })
    );

    return event.id;
  }

  public getHistory(topicFilter?: string, limit = 50): NexusEventPayload[] {
    const events = topicFilter
      ? this.eventHistory.filter((e) => e.topic === topicFilter || e.topic.startsWith(topicFilter))
      : this.eventHistory;
    return events.slice(-limit).reverse();
  }

  public getDLQ(): NexusEventPayload[] {
    return [...this.deadLetterQueue];
  }
}

export const eventBus = new NexusEventBus();
