export type DomainEventType = 
  | 'ResourceCreated'
  | 'StatusChanged'
  | 'ProgressUpdated'
  | 'MetadataRefreshed'
  | 'CollectionAssigned';

export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  payload: T;
  timestamp: number;
}

type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe<T = any>(eventType: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  public publish<T = any>(eventType: DomainEventType, payload: T): void {
    const event: DomainEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: eventType,
      payload,
      timestamp: Date.now(),
    };

    const listeners = this.handlers.get(eventType);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          console.error(`Error handling domain event ${eventType}:`, err);
        }
      });
    }
  }
}
