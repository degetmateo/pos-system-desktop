export type TaskPriority = 'high' | 'low';
export type AsyncTask = () => Promise<void> | void;

/**
 * Cola de tareas cooperativa en segundo plano (POSAD Active Object / Producer-Consumer + GoF Command).
 * Desacopla la recepción de eventos asíncronos (ej. WebSocket de WhatsApp) del procesamiento en SQLite,
 * cediendo siempre el turno al Event Loop de I/O (`setImmediate`) entre tareas y lotes para no bloquear
 * peticiones HTTP de Express ni la interfaz principal del POS.
 */
export class BackgroundTaskQueue {
  private readonly highQueue: AsyncTask[] = [];
  private readonly lowQueue: AsyncTask[] = [];
  private processing = false;
  private idleResolvers: Array<() => void> = [];

  public static yieldToEventLoop(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
  }

  public static async processInChunks<T>(
    items: readonly T[],
    chunkSize: number,
    processor: (chunk: T[]) => Promise<void> | void
  ): Promise<void> {
    if (items.length === 0) return;
    const safeChunk = Math.max(1, chunkSize);
    for (let i = 0; i < items.length; i += safeChunk) {
      const slice = items.slice(i, i + safeChunk);
      await processor(slice);
      if (i + safeChunk < items.length) {
        await BackgroundTaskQueue.yieldToEventLoop();
      }
    }
  }

  public enqueue(priority: TaskPriority, task: AsyncTask): void {
    if (priority === 'high') {
      this.highQueue.push(task);
    } else {
      this.lowQueue.push(task);
    }
    this.scheduleDrain();
  }

  public get pendingCount(): number {
    return this.highQueue.length + this.lowQueue.length + (this.processing ? 1 : 0);
  }

  public onIdle(): Promise<void> {
    if (!this.processing && this.highQueue.length === 0 && this.lowQueue.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.idleResolvers.push(resolve));
  }

  private scheduleDrain(): void {
    if (this.processing) return;
    this.processing = true;
    setImmediate(() => void this.drainLoop());
  }

  private async drainLoop(): Promise<void> {
    while (this.highQueue.length > 0 || this.lowQueue.length > 0) {
      const next = this.highQueue.shift() ?? this.lowQueue.shift();
      if (!next) break;
      try {
        await next();
      } catch (err) {
        console.error('[BackgroundTaskQueue] Task error:', err);
      }
      await BackgroundTaskQueue.yieldToEventLoop();
    }

    this.processing = false;
    if (this.highQueue.length > 0 || this.lowQueue.length > 0) {
      this.scheduleDrain();
      return;
    }

    const resolvers = this.idleResolvers.splice(0, this.idleResolvers.length);
    for (const resolve of resolvers) resolve();
  }
}

