import { describe, it, expect, beforeEach } from 'vitest';
import { ViewPreferenceStorage } from '../../src/public/services/view-preference.storage';
import { OrderDraftStorage } from '../../src/public/services/order-draft.storage';

describe('Storage Services (Preferences & Drafts)', () => {
  beforeEach(() => {
    // Mock localStorage for node environment
    const store: Record<string, string> = {};
    (global as any).window = {
      localStorage: {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      },
    };
  });

  describe('ViewPreferenceStorage', () => {
    it('returns default product preferences when empty', () => {
      const prefs = ViewPreferenceStorage.getProducts();
      expect(prefs.search).toBe('');
      expect(prefs.sortKey).toBe('name_asc');
    });

    it('saves and retrieves modified product preferences', () => {
      ViewPreferenceStorage.saveProducts({ search: 'cuaderno', sortKey: 'price_desc' });
      const prefs = ViewPreferenceStorage.getProducts();
      expect(prefs.search).toBe('cuaderno');
      expect(prefs.sortKey).toBe('price_desc');
    });

    it('saves and retrieves customer preferences', () => {
      ViewPreferenceStorage.saveCustomers({ search: 'Gomez', typeFilter: 'major', docFilter: 'with_phone' });
      const prefs = ViewPreferenceStorage.getCustomers();
      expect(prefs.search).toBe('Gomez');
      expect(prefs.typeFilter).toBe('major');
      expect(prefs.docFilter).toBe('with_phone');
    });

    it('saves and retrieves order preferences', () => {
      ViewPreferenceStorage.saveOrders({ typeFilter: 'minor', paymentFilter: 'cash', sortKey: 'total_desc' });
      const prefs = ViewPreferenceStorage.getOrders();
      expect(prefs.typeFilter).toBe('minor');
      expect(prefs.paymentFilter).toBe('cash');
      expect(prefs.sortKey).toBe('total_desc');
    });
  });

  describe('OrderDraftStorage', () => {
    it('saves, retrieves and clears draft V1', () => {
      expect(OrderDraftStorage.getDraftV1()).toBeNull();
      OrderDraftStorage.saveDraftV1({
        items: [],
        orderType: 'major',
        customerId: 'cust-123',
        paymentMethod: 'card',
        advancement: 500,
      });

      const draft = OrderDraftStorage.getDraftV1();
      expect(draft).not.toBeNull();
      expect(draft?.orderType).toBe('major');
      expect(draft?.customerId).toBe('cust-123');

      OrderDraftStorage.clearDraftV1();
      expect(OrderDraftStorage.getDraftV1()).toBeNull();
    });

    it('saves, retrieves and clears draft V2', () => {
      expect(OrderDraftStorage.getDraftV2()).toBeNull();
      OrderDraftStorage.saveDraftV2({
        rows: [
          {
            id: 'row-1',
            productId: null,
            productName: 'Resma A4',
            quantity: 3,
            unitPrice: 4500,
            originalPrice: null,
            isNewProduct: true,
            saveToDb: true,
            updatePriceInDb: false,
          },
        ],
        orderType: 'minor',
        customerId: '',
        paymentMethod: 'transfer',
        advancement: 0,
      });

      const draft = OrderDraftStorage.getDraftV2();
      expect(draft).not.toBeNull();
      expect(draft?.rows.length).toBe(1);
      expect(draft?.rows[0].productName).toBe('Resma A4');

      OrderDraftStorage.clearDraftV2();
      expect(OrderDraftStorage.getDraftV2()).toBeNull();
    });
  });
});
