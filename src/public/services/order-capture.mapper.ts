import { OrderDto } from '../types/api.types';
import { OrderCaptureData, OrderCaptureItem } from './order-capture.types';

export class OrderCaptureMapper {
  public static fromOrder(order: OrderDto, fallbackNumber?: number | null): OrderCaptureData {
    const rawAdv = (order as any).advancement;
    const advCents = typeof rawAdv === 'object' && rawAdv !== null ? rawAdv.cents : (rawAdv || 0);

    const items: OrderCaptureItem[] = (order.items || []).map((it) => {
      const rawP = (it as any).price ?? (it as any).unitPrice ?? (it as any).unit_price;
      const p = typeof rawP === 'object' && rawP !== null ? rawP.cents : (rawP || 0);
      const rawSub = (it as any).subtotal ?? (p * it.quantity);
      const subCents = typeof rawSub === 'object' && rawSub !== null ? rawSub.cents : rawSub;
      return {
        quantity: it.quantity,
        name: (it as any).product_name || (it as any).productName || 'Producto',
        unitPrice: p / 100,
        subtotal: subCents / 100,
      };
    });

    const calculatedSum = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    const rawTotalVal = (order as any).totalPrice ?? (order as any).total_price ?? (order as any).total;
    const totalCents = typeof rawTotalVal === 'object' && rawTotalVal !== null ? rawTotalVal.cents : (rawTotalVal || 0);
    const totalAmount = totalCents > 0 ? totalCents / 100 : calculatedSum;

    return {
      orderNumber: order.number || fallbackNumber || null,
      items,
      total: totalAmount,
      advancement: advCents / 100,
      paymentMethod: (order as any).paymentMethod || (order as any).payment_method || 'Efectivo',
      customerName: order.customer?.name,
    };
  }
}

