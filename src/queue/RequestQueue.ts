interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
}

export class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private processing: Map<string, Promise<unknown>> = new Map();
  private maxConcurrent: number;
  private currentlyProcessing: number = 0;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue<T>(id: string, executor: () => Promise<T>, priority: number = 0): Promise<T> {
    const existingPromise = this.processing.get(id);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id,
        execute: executor,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
      };

      this.queue.push(request as QueuedRequest<unknown>);
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.currentlyProcessing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.currentlyProcessing++;

    const processingPromise = (async (): Promise<unknown> => {
      try {
        const result = await request.execute();
        request.resolve(result);
        return result;
      } catch (error) {
        request.reject(error as Error);
        throw error;
      } finally {
        this.processing.delete(request.id);
        this.currentlyProcessing--;
        this.processQueue();
      }
    })();

    this.processing.set(request.id, processingPromise);

    if (this.currentlyProcessing < this.maxConcurrent) {
      this.processQueue();
    }
  }

  getStatus(): { queued: number; processing: number } {
    return {
      queued: this.queue.length,
      processing: this.currentlyProcessing,
    };
  }

  clear(): void {
    this.queue = [];
    this.processing.clear();
    this.currentlyProcessing = 0;
  }
}
