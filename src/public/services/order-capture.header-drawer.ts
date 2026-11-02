import logoImg from '../logo.png';
import { OrderCaptureData, formatPaymentMethod } from './order-capture.types';

export class OrderCaptureHeaderDrawer {
  public static async drawHeader(ctx: CanvasRenderingContext2D, data: OrderCaptureData): Promise<void> {
    await this.drawLogo(ctx);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('LIBRERÍA RUBÉN DARÍO', 115, 36);
    ctx.font = '11px Arial';
    ctx.fillText('Montevideo 1879 - General Pacheco', 115, 52);
    ctx.font = 'bold 11px Arial';
    ctx.fillText('WhatsApp (solo mensajes): 11-3884-6058 | Tel: 4740-1045', 115, 66);
    ctx.font = '11px Arial';
    ctx.fillText('Email: libreriard@yahoo.com.ar', 115, 80);
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#0369a1';
    ctx.fillText('Alias de Pago: ogro.caso.ruina', 115, 96);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(505, 36, 245, 24);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(505, 36, 245, 24);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PEDIDOS SE REALIZAN UNA VEZ SEÑADOS', 627, 52);

    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Facebook: @libreriard', 750, 74);

    if (data.orderNumber) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`ORDEN N° ${data.orderNumber}`, 750, 96);
    } else {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('PRESUPUESTO', 750, 96);
    }

    if (data.customerName) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(`Cliente: ${data.customerName}`, 750, 112);
    }
  }

  public static drawFooter(ctx: CanvasRenderingContext2D, y: number, method?: string): void {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Condiciones de Venta:', 30, y);
    ctx.font = '11px Arial';
    ctx.fillText(`Forma de Pago: ${formatPaymentMethod(method)}`, 30, y + 18);
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Presupuesto Válido por 5 Días  •  Productos Sujetos a Disponibilidad', 30, y + 38);
  }

  private static async drawLogo(ctx: CanvasRenderingContext2D): Promise<void> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoImg;
      await new Promise<void>((res) => {
        if (img.complete) return res();
        img.onload = () => res();
        img.onerror = () => res();
      });
      ctx.drawImage(img, 35, 25, 64, 64);
    } catch {}
  }
}

