import logoImg from '../logo.png';
import { OrderCaptureData, OrderCaptureItem, formatCaptureMoney, formatPaymentMethod } from './order-capture.types';

export class OrderCaptureCanvas {
  public static async generate(data: OrderCaptureData): Promise<Blob> {
    const scale = 2;
    const width = 780;
    const items = data.items.length > 0 ? data.items : [{ quantity: 1, name: 'Sin productos', unitPrice: 0, subtotal: 0 }];
    const calculatedSum = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    const effectiveTotal = data.total > 0 ? data.total : calculatedSum;
    const hasAdv = (data.advancement || 0) > 0;
    const height = 145 + ((items.length + 1 + (hasAdv ? 2 : 0)) * 26) + 115;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Error al inicializar canvas');
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    await this.drawHeader(ctx);
    const endY = this.drawTable(ctx, 125, items, effectiveTotal, data.advancement);
    this.drawFooter(ctx, endY + 16, data.paymentMethod);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Fallo al generar imagen'))), 'image/png');
    });
  }

  private static async drawLogo(ctx: CanvasRenderingContext2D): Promise<void> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoImg;
      await new Promise<void>((res) => { if (img.complete) return res(); img.onload = () => res(); img.onerror = () => res(); });
      ctx.drawImage(img, 35, 25, 64, 64);
    } catch {}
  }

  private static async drawHeader(ctx: CanvasRenderingContext2D): Promise<void> {
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
    ctx.fillText('Facebook: @libreriard', 750, 78);
  }

  private static drawTable(ctx: CanvasRenderingContext2D, y: number, items: OrderCaptureItem[], total: number, adv?: number): number {
    const x = 30;
    const colW = [80, 360, 130, 150];
    const r = [110, 470, 600, 750]; // Bordes derechos

    // Encabezados
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 720, 28);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center'; ctx.fillText('CANTIDAD', 70, y + 18);
    ctx.textAlign = 'left'; ctx.fillText('Producto', 120, y + 18);
    ctx.textAlign = 'right'; ctx.fillText('Precio unitario', 590, y + 18);
    ctx.textAlign = 'right'; ctx.fillText('PRECIO TOTAL', 740, y + 18);
    this.drawCols(ctx, x, y, 28, colW);
    y += 28;

    // Filas
    for (const it of items) {
      ctx.strokeRect(x, y, 720, 26);
      ctx.font = '11px Arial';
      ctx.textAlign = 'center'; ctx.fillText(String(it.quantity), 70, y + 18);
      ctx.textAlign = 'left'; ctx.fillText(it.name.slice(0, 48), 120, y + 18);
      ctx.textAlign = 'right'; ctx.fillText(formatCaptureMoney(it.unitPrice), 590, y + 18);
      ctx.textAlign = 'right'; ctx.fillText(formatCaptureMoney(it.subtotal), 740, y + 18);
      this.drawCols(ctx, x, y, 26, colW);
      y += 26;
    }

    // Fila Total
    ctx.strokeRect(x, y, 720, 30);
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL', 590, y + 20);
    ctx.fillText(formatCaptureMoney(total), 740, y + 20);
    this.drawCols(ctx, x, y, 30, colW);
    y += 30;

    if ((adv || 0) > 0) {
      const a = adv || 0;
      ctx.strokeRect(x, y, 720, 26);
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('SEÑA / ADELANTO:', 590, y + 18);
      ctx.fillText(`- ${formatCaptureMoney(a)}`, 740, y + 18);
      y += 26;

      ctx.strokeRect(x, y, 720, 28);
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('SALDO PENDIENTE:', 590, y + 19);
      ctx.fillText(formatCaptureMoney(Math.max(0, total - a)), 740, y + 19);
      y += 28;
    }

    return y;
  }

  private static drawCols(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, colW: number[]): void {
    let curX = x;
    for (let i = 0; i < colW.length - 1; i++) {
      curX += colW[i];
      ctx.beginPath();
      ctx.moveTo(curX, y);
      ctx.lineTo(curX, y + h);
      ctx.stroke();
    }
  }

  private static drawFooter(ctx: CanvasRenderingContext2D, y: number, method?: string): void {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Condiciones de Venta:', 30, y);
    ctx.font = '11px Arial';
    ctx.fillText(`Forma de Pago: ${formatPaymentMethod(method)}`, 30, y + 18);
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Presupuesto Válido por 5 Días  •  Productos Sujetos a Disponibilidad', 30, y + 38);
  }
}
