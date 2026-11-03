import { Request, Response } from 'express';
import { WhatsappRealtimeEvent, WhatsappStatusDto } from '../../application/dtos/whatsapp.dto';
import { WhatsappEventBus } from '../../application/services/whatsapp-event.bus';

export class WhatsappSseBroadcaster {
  private readonly clients = new Set<Response>();
  private readonly unsubscribe: () => void;

  constructor(eventBus: WhatsappEventBus) {
    this.unsubscribe = eventBus.subscribe((event) => this.broadcast(event));
  }

  public addClient(req: Request, res: Response, initialStatus: WhatsappStatusDto): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    this.clients.add(res);
    this.sendToClient(res, { type: 'status', payload: initialStatus });

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        this.clients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      this.clients.delete(res);
    });
  }

  public broadcast(event: WhatsappRealtimeEvent): void {
    for (const res of this.clients) {
      this.sendToClient(res, event);
    }
  }

  private sendToClient(res: Response, event: WhatsappRealtimeEvent): void {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      this.clients.delete(res);
    }
  }

  public dispose(): void {
    this.unsubscribe();
    this.clients.clear();
  }
}

