import { OrderDto } from '../types/api.types';
import { PosDraftV2, PosDraftV1, PosV2RowItem, CartItem } from '../views/pos/pos.types';
import { OrderDraftStorage } from './order-draft.storage';
import { ToastService } from './toast.service';

export class OrderRemakeService {
  public static remakeOrder(order: OrderDto): PosDraftV2 {
    const rawOrderType = typeof order.type === 'object' && order.type !== null
      ? (order.type as { code?: string }).code : order.type;
    const orderType: 'minor' | 'major' = rawOrderType === 'major' ? 'major' : 'minor';

    const rawPayment = typeof order.paymentMethod === 'object' && order.paymentMethod !== null
      ? (order.paymentMethod as { code?: string }).code : (order.paymentMethod || 'cash');
    const paymentMethod = rawPayment || 'cash';

    const rawAdv = typeof order.advancement === 'object' && order.advancement !== null
      ? (order.advancement as { cents?: number }).cents : (order.advancement || 0);
    const advancement = Number(rawAdv) || 0;

    const customerId = order.customerId || (order.customer?.id) || '';

    const items = Array.isArray(order.items) ? order.items : [];
    const rows: PosV2RowItem[] = items.map((it) => {
      const rowId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);

      const effectiveCents = typeof it.discountPrice === 'number' && it.discountPrice > 0
        ? it.discountPrice
        : (it.unitPrice || 0);

      const unitPriceDec = effectiveCents / 100;
      const originalPriceDec = (it.unitPrice || effectiveCents) / 100;

      return {
        id: rowId,
        productId: it.productId || null,
        productName: it.productName,
        quantity: it.quantity || 1,
        unitPrice: unitPriceDec,
        originalPrice: originalPriceDec,
        isNewProduct: false,
        saveToDb: false,
        updatePriceInDb: false,
      };
    });

    if (rows.length === 0) {
      rows.push({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'row-1',
        productId: null,
        productName: '',
        quantity: 1,
        unitPrice: 0,
        originalPrice: null,
        isNewProduct: false,
        saveToDb: false,
        updatePriceInDb: false,
      });
    }

    const draftV2: PosDraftV2 = { rows, orderType, customerId, paymentMethod, advancement };
    OrderDraftStorage.saveDraftV2(draftV2);

    const v1Items: CartItem[] = items.map((it) => {
      const priceCents = it.unitPrice || 0;
      return {
        product: {
          id: it.productId,
          name: it.productName,
          barcode: null,
          description: '',
          stock: 0,
          providerId: null,
          priceMajor: priceCents,
          priceMinor: priceCents,
          minorPrices: [],
        },
        quantity: it.quantity,
        basePrice: priceCents,
        effectivePrice: typeof it.discountPrice === 'number' && it.discountPrice > 0 ? it.discountPrice : priceCents,
      };
    });

    const draftV1: PosDraftV1 = { items: v1Items, orderType, customerId, paymentMethod, advancement };
    OrderDraftStorage.saveDraftV1(draftV1);

    ToastService.success(`Datos de orden #${order.number} cargados en una nueva orden para edición.`);
    return draftV2;
  }
}

