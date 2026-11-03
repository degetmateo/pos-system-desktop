import { WhatsappRealtimeEvent } from '../dtos/whatsapp.dto';

export type WhatsappEventListener = (event: WhatsappRealtimeEvent) => void;

/**
 * Observer / Publisher-Subscriber (GoF & POSAD):
 * Canal central desacoplado de eventos en tiempo real de WhatsApp.
 */
export class WhatsappEventBus {
  private readonly listeners = new Set<WhatsappEventListener>();

  public subscribe(listener: WhatsappEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public publish(event: WhatsappRealtimeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[WhatsappEventBus] Error en listener:', err);
      }
    }
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }
}

