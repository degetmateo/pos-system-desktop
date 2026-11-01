import { PosV2RowItem } from './pos.types';
import { CreateOrderDto } from '../../../application/dtos/order.dto';

export class PosV2Calculator {
  public static createEmptyRow(): PosV2RowItem {
    return {
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: null,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      originalPrice: null,
      isNewProduct: true,
      saveToDb: true,
      updatePriceInDb: false,
    };
  }

  public static getRowSubtotal(row: PosV2RowItem): number {
    return Math.max(0, (row.quantity || 0) * (row.unitPrice || 0));
  }

  public static getTotals(rows: PosV2RowItem[]): { total: number; itemCount: number } {
    let total = 0;
    let itemCount = 0;
    for (const r of rows) {
      if (r.productName.trim() && r.quantity > 0) {
        total += this.getRowSubtotal(r);
        itemCount += r.quantity;
      }
    }
    return { total: Math.round(total * 100), itemCount }; // total returned in cents
  }

  public static buildCreateOrderDto(
    rows: PosV2RowItem[],
    customerId: string,
    orderType: 'minor' | 'major',
    paymentMethod: string,
    advancement: number
  ): CreateOrderDto {
    const validRows = rows.filter((r) => r.productName.trim().length > 0 && r.quantity > 0);
    return {
      customer_id: customerId || null,
      type: orderType,
      payment_method: paymentMethod,
      advancement,
      products: validRows.map((r) => ({
        product_id: r.productId || null,
        name: r.productName.trim(),
        quantity: r.quantity,
        unit_price: r.unitPrice,
        save_to_db: r.isNewProduct ? r.saveToDb : false,
        update_price_in_db: !r.isNewProduct ? r.updatePriceInDb : false,
      })),
    };
  }
}

