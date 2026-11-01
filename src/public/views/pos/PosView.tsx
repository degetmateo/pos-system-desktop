import React, { useState, useEffect, useRef } from 'react';
import { ProductDto, CustomerDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';
import { ToastService } from '../../services/toast.service';
import { OrderDraftStorage } from '../../services/order-draft.storage';
import { CartItem } from './pos.types';
import { PosCartCalculator } from './PosCartCalculator';
import { PosTopBar } from './PosTopBar';
import { PosCartTable } from './PosCartTable';
import { PosSummaryPanel } from './PosSummaryPanel';
import { PosProductSearchModal } from './PosProductSearchModal';
import { PosReceiptModal } from './PosReceiptModal';

interface PosViewProps {
  onSwitchToV2?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({ onSwitchToV2 }) => {
  const initialDraft = OrderDraftStorage.getDraftV1();
  const [items, setItems] = useState<CartItem[]>(initialDraft?.items || []);
  const [orderType, setOrderType] = useState<'minor' | 'major'>(initialDraft?.orderType || 'minor');
  const [customerId, setCustomerId] = useState<string>(initialDraft?.customerId || '');
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>(initialDraft?.paymentMethod || 'cash');
  const [advancement, setAdvancement] = useState<number>(initialDraft?.advancement || 0);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; number: number } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ApiClient.getCustomers().then(setCustomers).catch(() => {});
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    OrderDraftStorage.saveDraftV1({ items, orderType, customerId, paymentMethod, advancement });
  }, [items, orderType, customerId, paymentMethod, advancement]);

  const handleAdd = (prod: ProductDto) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === prod.id);
      const updated = idx >= 0
        ? prev.map((it, i) => (i === idx ? { ...it, quantity: it.quantity + 1 } : it))
        : [...prev, { product: prod, quantity: 1, ...PosCartCalculator.calculateItemPrice(prod, 1, orderType) }];
      return PosCartCalculator.recalculateCart(updated, orderType);
    });
    ToastService.success(`Agregado: ${prod.name}`);
  };

  const handleBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    try {
      const prod = await ApiClient.getProductByBarcode(barcodeInput.trim());
      if (!prod) throw new Error(`Código "${barcodeInput}" no encontrado.`);
      handleAdd(prod); setBarcodeInput('');
    } catch (err: any) { ToastService.error(err.message); }
  };

  const handleQty = (id: string, d: number) => {
    setItems((p) => PosCartCalculator.recalculateCart(p.map((it) => (it.product.id === id ? { ...it, quantity: Math.max(1, it.quantity + d) } : it)), orderType));
  };

  const handleRemove = (id: string) => setItems((p) => PosCartCalculator.recalculateCart(p.filter((i) => i.product.id !== id), orderType));
  const handleType = (t: 'minor' | 'major') => { setOrderType(t); setItems((p) => PosCartCalculator.recalculateCart(p, t)); };

  const handleReset = () => {
    setItems([]);
    setAdvancement(0);
    OrderDraftStorage.clearDraftV1();
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const order = await ApiClient.createOrder({
        customer_id: customerId || null, type: orderType, payment_method: paymentMethod, advancement,
        products: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      });
      setCreatedOrder({ id: order.id, number: order.number });
      setItems([]); setAdvancement(0);
      OrderDraftStorage.clearDraftV1();
      ToastService.success('Venta registrada.');
    } catch (e: any) { ToastService.error(e.message); } finally { setLoading(false); }
  };

  const { total, totalDiscount, itemCount } = PosCartCalculator.getTotals(items);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          Vista Estándar (V1)
        </button>
        {onSwitchToV2 && (
          <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={onSwitchToV2}>
            Nueva Vista V2 (Hoja de Cálculo / Excel)
          </button>
        )}
      </div>

      <div className="pos-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>
          <PosTopBar
            barcodeInput={barcodeInput} barcodeInputRef={barcodeInputRef} onBarcodeChange={setBarcodeInput}
            onBarcodeSubmit={handleBarcode} onOpenSearch={() => setSearchOpen(true)}
            orderType={orderType} onOrderTypeChange={handleType} customerId={customerId} onCustomerChange={setCustomerId} customers={customers}
          />
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <PosCartTable items={items} onUpdateQty={handleQty} onRemoveItem={handleRemove} />
          </div>
        </div>
        <PosSummaryPanel
          total={total} totalDiscount={totalDiscount} advancement={advancement} paymentMethod={paymentMethod}
          onAdvancementChange={setAdvancement} onPaymentMethodChange={setPaymentMethod}
          onSubmit={handleSubmit} onReset={handleReset} loading={loading} itemCount={itemCount}
        />
        <PosProductSearchModal isOpen={searchOpen} onClose={() => { setSearchOpen(false); barcodeInputRef.current?.focus(); }} onSelectProduct={handleAdd} />
        <PosReceiptModal orderId={createdOrder?.id || null} orderNumber={createdOrder?.number || null} onClose={() => { setCreatedOrder(null); barcodeInputRef.current?.focus(); }} />
      </div>
    </div>
  );
};
