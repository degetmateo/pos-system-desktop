import React from 'react';
import { PosV2RowItem } from './pos.types';

interface PosV2RowOptionsProps {
  row: PosV2RowItem;
  onUpdate: (id: string, patch: Partial<PosV2RowItem>) => void;
}

export const PosV2RowOptions: React.FC<PosV2RowOptionsProps> = ({ row, onUpdate }) => {
  const isPriceModified = !row.isNewProduct && row.originalPrice !== null && row.unitPrice !== row.originalPrice;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem' }}>
      {row.isNewProduct && row.productName.trim() && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#0369a1' }}>
          <input
            type="checkbox"
            tabIndex={-1}
            checked={row.saveToDb}
            onChange={(e) => onUpdate(row.id, { saveToDb: e.target.checked })}
          />
          Crear en BD
        </label>
      )}
      {isPriceModified && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#b45309' }}>
          <input
            type="checkbox"
            tabIndex={-1}
            checked={row.updatePriceInDb}
            onChange={(e) => onUpdate(row.id, { updatePriceInDb: e.target.checked })}
          />
          Actualizar en BD
        </label>
      )}
    </div>
  );
};

