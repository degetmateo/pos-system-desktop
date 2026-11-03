import { describe, it, expect } from 'vitest';
import { BackgroundTaskQueue } from '../../src/infrastructure/concurrency/background-task.queue';

describe('BackgroundTaskQueue (POSAD Active Object & Cooperative Yielding)', () => {
  it('executes high-priority realtime tasks ahead of queued low-priority sync tasks', async () => {
    const queue = new BackgroundTaskQueue();
    const order: string[] = [];

    queue.enqueue('low', () => { order.push('low-1'); });
    queue.enqueue('low', () => { order.push('low-2'); });
    queue.enqueue('high', () => { order.push('high-1'); });
    queue.enqueue('high', () => { order.push('high-2'); });

    await queue.onIdle();
    expect(order).toEqual(['high-1', 'high-2', 'low-1', 'low-2']);
  });

  it('yields cooperatively to the event loop between chunks without starving concurrent I/O callbacks', async () => {
    const items = Array.from({ length: 250 }, (_, i) => i);
    let processed = 0;
    let concurrentTimerFiredMidSync = false;

    const immediatePromise = new Promise<void>((resolve) => {
      setImmediate(() => {
        if (processed > 0 && processed < items.length) {
          concurrentTimerFiredMidSync = true;
        }
        resolve();
      });
    });

    await BackgroundTaskQueue.processInChunks(items, 25, (chunk) => {
      processed += chunk.length;
    });
    await immediatePromise;

    expect(processed).toBe(250);
    expect(concurrentTimerFiredMidSync).toBe(true);
  });

  it('continues draining remaining tasks if an earlier background task throws', async () => {
    const queue = new BackgroundTaskQueue();
    let survived = false;

    queue.enqueue('low', () => {
      throw new Error('Transient network failure');
    });
    queue.enqueue('high', () => {
      survived = true;
    });

    await queue.onIdle();
    expect(survived).toBe(true);
    expect(queue.pendingCount).toBe(0);
  });
});

