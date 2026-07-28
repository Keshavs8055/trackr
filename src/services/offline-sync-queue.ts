import { EventBus } from "@/domain/events/event-bus";

export interface QueuedSyncOperation {
  id: string;
  type: "CREATE_RESOURCE" | "UPDATE_RESOURCE" | "DELETE_RESOURCE" | "REFRESH_METADATA";
  payload: any;
  queuedAt: number;
  retries: number;
}

export class OfflineSyncQueue {
  private static instance: OfflineSyncQueue;
  private queue: QueuedSyncOperation[] = [];
  private isFlushing = false;
  private STORAGE_KEY = "trackr_offline_queue";

  private constructor() {
    this.loadFromStorage();
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.flushQueue());
    }
  }

  public static getInstance(): OfflineSyncQueue {
    if (!OfflineSyncQueue.instance) {
      OfflineSyncQueue.instance = new OfflineSyncQueue();
    }
    return OfflineSyncQueue.instance;
  }

  public enqueue(type: QueuedSyncOperation["type"], payload: any): void {
    const op: QueuedSyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      queuedAt: Date.now(),
      retries: 0,
    };

    this.queue.push(op);
    this.saveToStorage();

    // If online, try immediate flush
    if (typeof navigator !== "undefined" && navigator.onLine) {
      this.flushQueue();
    }
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public async flushQueue(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    this.isFlushing = true;
    const pending = [...this.queue];

    for (const op of pending) {
      try {
        // Execute operation based on type
        EventBus.getInstance().publish("StatusChanged", {
          userId: op.payload?.userId || "user",
          resourceId: op.payload?.id || "queued",
          resourceTitle: op.payload?.title || "Offline Sync",
          oldStatus: "queued",
          newStatus: "flushed",
        });

        // Remove from queue
        this.queue = this.queue.filter((q) => q.id !== op.id);
        this.saveToStorage();
      } catch (err) {
        op.retries++;
        if (op.retries > 3) {
          // Drop operation after max retries
          this.queue = this.queue.filter((q) => q.id !== op.id);
          this.saveToStorage();
        }
      }
    }

    this.isFlushing = false;
  }

  private loadFromStorage(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {}
  }

  private saveToStorage(): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch {}
  }
}

export const offlineSyncQueue = OfflineSyncQueue.getInstance();
