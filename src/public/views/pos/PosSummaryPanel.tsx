import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface PosSummaryPanelProps {
  total: number;
  totalDiscount: number;
  advancement: number;
  paymentMethod: string;
  onAdvancementChange: (val: number) => void;
  onPaymentMethodChange: (val: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
  itemCount: number;
}

export const PosSummaryPanel: React.FC<PosSummaryPanelProps> = ({
  total, totalDiscount, advancement, paymentMethod,
  onAdvancementChange, onPaymentMethodChange, onSubmit, onReset, loading, itemCount
}) => {
  const finalTotal = Math.max(0, total - advancement);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        Resumen de Venta
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>Artículos:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{itemCount}</span>
        </div>
        {totalDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
            <span>Descuentos:</span>
            <span style={{ fontWeight: 700 }}>-${(totalDiscount / 100).toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
          <span>Total:</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Método de Pago</label>
        <select className="select" value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)}>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="card">Tarjeta</option>
          <option value="current_account">Cuenta Corriente</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Adelanto / Seña ($)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          placeholder="0.00"
          value={advancement > 0 ? (advancement / 100).toString() : ''}
          onChange={(e) => onAdvancementChange(Math.round((parseFloat(e.target.value) || 0) * 100))}
        />
        {advancement > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: '#0369a1' }}>
            <span>Saldo Restante:</span>
            <span>${(finalTotal / 100).toFixed(2)}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 700 }}
          disabled={loading || itemCount === 0}
          onClick={onSubmit}
        >
          <CheckCircle2 size={18} /> {loading ? 'Emitiendo...' : 'Confirmar y Cobrar'}
        </button>
        <button className="btn btn-secondary" style={{ width: '100%' }} disabled={loading || itemCount === 0} onClick={onReset}>
          <RotateCcw size={16} /> Limpiar Carrito
        </button>
      </div>
    </div>
  );
};

