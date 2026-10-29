import React, { useState } from 'react';
import { Barcode, Search, User, ChevronDown } from 'lucide-react';
import { CustomerDto } from '../../types/api.types';
import { PosCustomerSelectModal } from './PosCustomerSelectModal';

interface PosTopBarProps {
  barcodeInput: string;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  onBarcodeChange: (val: string) => void;
  onBarcodeSubmit: (e: React.FormEvent) => void;
  onOpenSearch: () => void;
  orderType: 'minor' | 'major';
  onOrderTypeChange: (type: 'minor' | 'major') => void;
  customerId: string;
  onCustomerChange: (id: string) => void;
  customers: CustomerDto[];
}

export const PosTopBar: React.FC<PosTopBarProps> = ({
  barcodeInput, barcodeInputRef, onBarcodeChange, onBarcodeSubmit, onOpenSearch,
  orderType, onOrderTypeChange, customerId, onCustomerChange, customers
}) => {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const selectedCust = customers.find((c) => c.id === customerId);
  const customerLabel = selectedCust ? selectedCust.name : 'Consumidor Final';

  return (
    <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
      <form onSubmit={onBarcodeSubmit} className="pos-barcode-form" style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '240px' }}>
        <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
          <Barcode size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            ref={barcodeInputRef}
            type="text"
            className="input"
            style={{ paddingLeft: '38px', fontWeight: 600 }}
            placeholder="Código de barras (Enter)..."
            value={barcodeInput}
            onChange={(e) => onBarcodeChange(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={onOpenSearch}>
          <Search size={16} /> Buscar
        </button>
      </form>

      <div className="pos-actions-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
          <button
            type="button"
            className="btn"
            style={{ padding: '6px 12px', fontSize: '0.85rem', background: orderType === 'minor' ? '#fff' : 'transparent', color: 'var(--text-primary)' }}
            onClick={() => onOrderTypeChange('minor')}
          >
            Minorista
          </button>
          <button
            type="button"
            className="btn"
            style={{ padding: '6px 12px', fontSize: '0.85rem', background: orderType === 'major' ? '#fff' : 'transparent', color: 'var(--text-primary)' }}
            onClick={() => onOrderTypeChange('major')}
          >
            Mayorista
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ flex: '1', minWidth: '130px', justifyContent: 'space-between', padding: '7px 12px' }}
          onClick={() => setCustomerModalOpen(true)}
          title="Buscar y seleccionar cliente"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <User size={15} color="var(--brand-celeste)" />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {customerLabel}
            </span>
          </div>
          <ChevronDown size={14} color="var(--text-muted)" />
        </button>

        <PosCustomerSelectModal
          isOpen={customerModalOpen}
          selectedCustomerId={customerId}
          customers={customers}
          onSelectCustomer={(id, defType) => {
            onCustomerChange(id);
            if (defType) onOrderTypeChange(defType);
          }}
          onClose={() => setCustomerModalOpen(false)}
        />
      </div>
    </div>
  );
};

