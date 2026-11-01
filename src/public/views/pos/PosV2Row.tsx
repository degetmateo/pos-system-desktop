import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PosV2RowItem } from './pos.types';
import { ProductDto } from '../../types/api.types';
import { PosV2Calculator } from './PosV2Calculator';
import { PosV2RowOptions } from './PosV2RowOptions';
import { PosV2ProductCell } from './PosV2ProductCell';

interface PosV2RowProps {
  row: PosV2RowItem;
  rowIndex: number;
  orderType: 'minor' | 'major';
  onUpdate: (id: string, patch: Partial<PosV2RowItem>) => void;
  onDelete: (id: string) => void;
  onEnterCell: (rowIndex: number, colName: 'name' | 'quantity' | 'unitPrice') => void;
  onTabUnitPrice: (rowIndex: number) => void;
}

export const PosV2Row: React.FC<PosV2RowProps> = ({
  row,
  rowIndex,
  orderType,
  onUpdate,
  onDelete,
  onEnterCell,
  onTabUnitPrice,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectProduct = (p: ProductDto) => {
    const rawCents = orderType === 'major'
      ? (typeof p.priceMajor === 'object' && p.priceMajor !== null ? (p.priceMajor as { cents: number }).cents : p.priceMajor)
      : (typeof p.priceMinor === 'object' && p.priceMinor !== null ? (p.priceMinor as { cents: number }).cents : p.priceMinor);
    const decimalPrice = (rawCents || 0) / 100;

    onUpdate(row.id, {
      productId: p.id,
      productName: p.name,
      unitPrice: decimalPrice,
      originalPrice: decimalPrice,
      isNewProduct: false,
      saveToDb: false,
      updatePriceInDb: false,
    });
  };

  const subtotal = PosV2Calculator.getRowSubtotal(row);

  return (
    <tr style={{ position: 'relative', zIndex: isDropdownOpen ? 50 : 1, background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ position: 'relative', zIndex: isDropdownOpen ? 60 : 1, minWidth: '220px', padding: '6px 8px' }}>
        <PosV2ProductCell
          rowIndex={rowIndex}
          value={row.productName}
          onChange={(name) => onUpdate(row.id, { productName: name, productId: null, isNewProduct: true, saveToDb: true })}
          onSelectProduct={handleSelectProduct}
          onEnterCell={() => onEnterCell(rowIndex, 'name')}
          onDropdownStateChange={setIsDropdownOpen}
        />
      </td>

      <td style={{ width: '90px', padding: '6px 8px' }}>
        <input
          data-pos-row={rowIndex}
          data-pos-col="quantity"
          type="number"
          min="1"
          className="input"
          style={{ width: '100%', textAlign: 'center', fontSize: '0.88rem', padding: '6px 4px' }}
          value={row.quantity || ''}
          onChange={(e) => onUpdate(row.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEnterCell(rowIndex, 'quantity');
            }
          }}
        />
      </td>

      <td style={{ width: '120px', padding: '6px 8px' }}>
        <input
          data-pos-row={rowIndex}
          data-pos-col="unitPrice"
          type="number"
          step="0.01"
          min="0"
          className="input"
          style={{ width: '100%', textAlign: 'right', fontSize: '0.88rem', padding: '6px 8px', fontWeight: 600 }}
          value={row.unitPrice === 0 ? '' : row.unitPrice}
          placeholder="0.00"
          onChange={(e) => onUpdate(row.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEnterCell(rowIndex, 'unitPrice');
            } else if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault();
              onTabUnitPrice(rowIndex);
            }
          }}
        />
      </td>

      <td style={{ width: '110px', padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--brand-dark)' }}>
        ${subtotal.toFixed(2)}
      </td>

      <td style={{ width: '170px', padding: '6px 8px' }}>
        <PosV2RowOptions row={row} onUpdate={onUpdate} />
      </td>

      <td style={{ width: '50px', padding: '6px 8px', textAlign: 'center' }}>
        <button
          type="button"
          tabIndex={-1}
          className="btn btn-secondary"
          style={{ padding: '6px', color: 'var(--danger)' }}
          onClick={() => onDelete(row.id)}
          title="Eliminar fila"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
};
