import { OrderCaptureItem, formatCaptureMoney } from './order-capture.types';

export class OrderCaptureTableDrawer {
  public static draw(
    ctx: CanvasRenderingContext2D,
    y: number,
    items: OrderCaptureItem[],
    total: number,
    adv?: number
  ): number {
    const x = 30;
    const colW = [80, 360, 130, 150];

    // Encabezados de tabla
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

    // Filas de artículos
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

    // Seña y Saldo Pendiente
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
}

