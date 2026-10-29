import React from 'react';
import { MinorPriceRule } from '../../types/api.types';

interface ProductDiscountsSubFormProps {
  minorPrices: MinorPriceRule[];
  onChange: (index: number, field: 'conditionValue' | 'priceValue', val: number) => void;
}

export const ProductDiscountsSubForm: React.FC<ProductDiscountsSubFormProps> = ({ minorPrices, onChange }) => {
  return (
    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Descuentos Minoristas (Hasta 4 Escalas por Cantidad)</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {[0, 1, 2, 3].map((idx) => {
          const item = minorPrices?.[idx] as any;
          const cond = item?.conditionValue ?? item?.condition_value ?? '';
          const pVal = item?.priceValue ?? item?.price_value;
          const priceStr = pVal !== undefined && pVal !== null && pVal > 0 ? (pVal / 100).toString() : '';
          return (
            <div key={idx} style={{ display: 'flex', gap: '4px' }}>
              <input type="number" placeholder="Cant." title={`Escala ${idx + 1} - Cantidad mínima`} className="input" style={{ width: '65px' }} value={cond} onChange={(e) => onChange(idx, 'conditionValue', parseInt(e.target.value) || 0)} />
              <input type="number" step="0.01" placeholder="Precio ($)" title={`Escala ${idx + 1} - Precio unitario bonificado`} className="input" value={priceStr} onChange={(e) => onChange(idx, 'priceValue', Math.round((parseFloat(e.target.value) || 0) * 100))} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

