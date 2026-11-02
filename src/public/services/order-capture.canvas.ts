import { OrderCaptureData } from './order-capture.types';
import { OrderCaptureHeaderDrawer } from './order-capture.header-drawer';
import { OrderCaptureTableDrawer } from './order-capture.table-drawer';

export class OrderCaptureCanvas {
  public static async generate(data: OrderCaptureData): Promise<Blob> {
    const scale = 2;
    const width = 780;
    const items = data.items.length > 0
      ? data.items
      : [{ quantity: 1, name: 'Sin productos', unitPrice: 0, subtotal: 0 }];
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

    await OrderCaptureHeaderDrawer.drawHeader(ctx, data);
    const endY = OrderCaptureTableDrawer.draw(ctx, 125, items, effectiveTotal, data.advancement);
    OrderCaptureHeaderDrawer.drawFooter(ctx, endY + 16, data.paymentMethod);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Fallo al generar imagen'))),
        'image/png'
      );
    });
  }
}
