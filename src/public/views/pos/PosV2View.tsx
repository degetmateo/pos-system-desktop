import React, { useState, useRef } from 'react';
import { ApiClient } from '../../services/api.client';
import { ToastService } from '../../services/toast.service';
import { PosV2Calculator } from './PosV2Calculator';
import { PosTopBar } from './PosTopBar';
import { PosV2Grid } from './PosV2Grid';
import { PosSummaryPanel } from './PosSummaryPanel';
import { PosReceiptModal } from './PosReceiptModal';
import { usePosV2Order } from './usePosV2Order';

interface PosV2ViewProps {
  onSwitchToV1?: () => void;
}

export const PosV2View: React.FC<PosV2ViewProps> = ({ onSwitchToV1 }) => {
  const {
    rows, orderType, customerId, customers, paymentMethod, advancement, loading, createdOrder,
    setOrderType, setCustomerId, setPaymentMethod, setAdvancement, setCreatedOrder,
    handleUpdateRow, handleDeleteRow, handleAddRow, handleCellEnter, handleTabUnitPrice, handleSelectProduct, handleReset, handleSubmit,
  } = usePosV2Order();

  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    try {
      const prod = await ApiClient.getProductByBarcode(barcodeInput.trim());
      if (!prod) throw new Error(`Código "${barcodeInput}" no encontrado.`);
      handleSelectProduct(prod);
      setBarcodeInput('');
    } catch (err: any) {
      ToastService.error(err.message);
    }
  };

  const { total, itemCount } = PosV2Calculator.getTotals(rows);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onSwitchToV1 && (
          <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={onSwitchToV1}>
            Vista Estándar (V1)
          </button>
        )}
        <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          Nueva Vista V2 (Hoja de Cálculo / Excel)
        </button>
      </div>

      <div className="pos-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>
          <PosTopBar
            barcodeInput={barcodeInput} barcodeInputRef={barcodeInputRef} onBarcodeChange={setBarcodeInput}
            onBarcodeSubmit={handleBarcode}
            orderType={orderType} onOrderTypeChange={setOrderType} customerId={customerId} onCustomerChange={setCustomerId} customers={customers}
          />
          <div className="card" style={{ padding: '12px', overflow: 'visible' }}>
            <PosV2Grid
              rows={rows}
              orderType={orderType}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={handleDeleteRow}
              onAddRow={handleAddRow}
              onEnterCell={handleCellEnter}
              onTabUnitPrice={handleTabUnitPrice}
            />
          </div>
        </div>

        <PosSummaryPanel
          total={total} totalDiscount={0} advancement={advancement} paymentMethod={paymentMethod}
          onAdvancementChange={setAdvancement} onPaymentMethodChange={setPaymentMethod}
          onSubmit={handleSubmit} onReset={handleReset} loading={loading} itemCount={itemCount}
        />

        <PosReceiptModal orderId={createdOrder?.id || null} orderNumber={createdOrder?.number || null} onClose={() => setCreatedOrder(null)} />
      </div>
    </div>
  );
};
