import { describe, it, expect } from 'vitest';
import { PosV2Calculator } from '../../src/public/views/pos/PosV2Calculator';
import { PosV2RowItem } from '../../src/public/views/pos/pos.types';

describe('PosV2Calculator', () => {
  it('creates an empty row with default values', () => {
    const row = PosV2Calculator.createEmptyRow();
    expect(row.id).toBeDefined();
    expect(row.productName).toBe('');
    expect(row.quantity).toBe(1);
    expect(row.unitPrice).toBe(0);
    expect(row.isNewProduct).toBe(true);
    expect(row.saveToDb).toBe(true);
  });

  it('calculates row subtotal correctly', () => {
    const row: PosV2RowItem = {
      id: '1',
      productId: 'p1',
      productName: 'Cuaderno',
      quantity: 3,
      unitPrice: 150.5,
      originalPrice: 150.5,
      isNewProduct: false,
      saveToDb: false,
      updatePriceInDb: false,
    };
    expect(PosV2Calculator.getRowSubtotal(row)).toBe(451.5);
  });

  it('calculates overall totals for valid rows', () => {
    const rows: PosV2RowItem[] = [
      {
        id: '1',
        productId: 'p1',
        productName: 'Item 1',
        quantity: 2,
        unitPrice: 100,
        originalPrice: 100,
        isNewProduct: false,
        saveToDb: false,
        updatePriceInDb: false,
      },
      {
        id: '2',
        productId: null,
        productName: 'Item 2',
        quantity: 1,
        unitPrice: 50,
        originalPrice: null,
        isNewProduct: true,
        saveToDb: true,
        updatePriceInDb: false,
      },
      {
        id: '3',
        productId: null,
        productName: '', // empty row should be ignored
        quantity: 1,
        unitPrice: 0,
        originalPrice: null,
        isNewProduct: true,
        saveToDb: true,
        updatePriceInDb: false,
      },
    ];

    const totals = PosV2Calculator.getTotals(rows);
    // (2 * 100 + 1 * 50) = 250 -> 25000 cents
    expect(totals.total).toBe(25000);
    expect(totals.itemCount).toBe(3);
  });

  it('builds CreateOrderDto ignoring blank rows', () => {
    const rows: PosV2RowItem[] = [
      {
        id: '1',
        productId: 'p-1',
        productName: 'Lapicera',
        quantity: 2,
        unitPrice: 70,
        originalPrice: 50,
        isNewProduct: false,
        saveToDb: false,
        updatePriceInDb: true,
      },
      {
        id: '2',
        productId: null,
        productName: 'Goma',
        quantity: 5,
        unitPrice: 30,
        originalPrice: null,
        isNewProduct: true,
        saveToDb: true,
        updatePriceInDb: false,
      },
    ];

    const dto = PosV2Calculator.buildCreateOrderDto(rows, 'cust-1', 'minor', 'cash', 50);
    expect(dto.customer_id).toBe('cust-1');
    expect(dto.products.length).toBe(2);
    expect(dto.products[0].update_price_in_db).toBe(true);
    expect(dto.products[1].save_to_db).toBe(true);
  });
});

