import React from 'react';
import { Plus } from 'lucide-react';
import { PosV2RowItem } from './pos.types';
import { PosV2Row } from './PosV2Row';

interface PosV2GridProps {
  rows: PosV2RowItem[];
  orderType: 'minor' | 'major';
  onUpdateRow: (id: string, patch: Partial<PosV2RowItem>) => void;
  onDeleteRow: (id: string) => void;
  onAddRow: () => void;
  onEnterCell: (rowIndex: number, colName: 'name' | 'quantity' | 'unitPrice') => void;
  onTabUnitPrice: (rowIndex: number) => void;
}

export const PosV2Grid: React.FC<PosV2GridProps> = ({
  rows,
  orderType,
  onUpdateRow,
  onDeleteRow,
  onAddRow,
  onEnterCell,
  onTabUnitPrice,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="table-container" style={{ overflow: 'visible', minHeight: '220px' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '8px 10px', fontSize: '0.82rem', textAlign: 'left' }}>Producto (Nombre)</th>
              <th style={{ padding: '8px 10px', fontSize: '0.82rem', textAlign: 'center', width: '90px' }}>Cant.</th>
              <th style={{ padding: '8px 10px', fontSize: '0.82rem', textAlign: 'right', width: '120px' }}>P. Unit ($)</th>
              <th style={{ padding: '8px 10px', fontSize: '0.82rem', textAlign: 'right', width: '110px' }}>Subtotal</th>
              <th style={{ padding: '8px 10px', fontSize: '0.82rem', textAlign: 'left', width: '170px' }}>Opciones BD</th>
              <th style={{ padding: '8px 10px', fontSize: '0.82rem', textAlign: 'center', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <PosV2Row
                key={row.id}
                row={row}
                rowIndex={index}
                orderType={orderType}
                onUpdate={onUpdateRow}
                onDelete={onDeleteRow}
                onEnterCell={onEnterCell}
                onTabUnitPrice={onTabUnitPrice}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px' }}>
        <button
          type="button"
          tabIndex={-1}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={onAddRow}
        >
          <Plus size={15} /> Agregar Fila (o presiona Enter)
        </button>
      </div>
    </div>
  );
};
