import React from 'react';
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, History } from 'lucide-react';
import { ProductDto } from '../../types/api.types';

interface ProductsTableProps {
  products: ProductDto[];
  loading: boolean;
  sortKey: string;
  onSortChange: (newSortKey: string) => void;
  onEdit: (product: ProductDto) => void;
  onDelete: (id: string) => void;
  onViewPriceHistory: (product: ProductDto) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading,
  sortKey,
  onSortChange,
  onEdit,
  onDelete,
  onViewPriceHistory,
}) => {
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando catálogo...</div>;
  }
  if (products.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron productos con los filtros aplicados.</div>;
  }

  const renderSortIcon = (ascKey: string, descKey: string) => {
    if (sortKey === ascKey) return <ArrowUp size={14} color="var(--brand-celeste-hover)" />;
    if (sortKey === descKey) return <ArrowDown size={14} color="var(--brand-celeste-hover)" />;
    return <ArrowUpDown size={14} style={{ opacity: 0.35 }} />;
  };

  const handleHeaderClick = (ascKey: string, descKey: string) => {
    if (sortKey === ascKey) {
      onSortChange(descKey);
    } else {
      onSortChange(ascKey);
    }
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('barcode_asc', 'barcode_desc')}
              title="Ordenar por Código"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Código</span>
                {renderSortIcon('barcode_asc', 'barcode_desc')}
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('name_asc', 'name_desc')}
              title="Ordenar por Nombre"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Nombre</span>
                {renderSortIcon('name_asc', 'name_desc')}
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('price_asc', 'price_desc')}
              title="Ordenar por Precio Minorista"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Precio Min.</span>
                {renderSortIcon('price_asc', 'price_desc')}
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('price_major_asc', 'price_major_desc')}
              title="Ordenar por Precio Mayorista"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Precio May.</span>
                {renderSortIcon('price_major_asc', 'price_major_desc')}
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('stock_asc', 'stock_desc')}
              title="Ordenar por Stock"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Stock</span>
                {renderSortIcon('stock_asc', 'stock_desc')}
              </div>
            </th>
            <th style={{ width: '90px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const barcode = typeof p.barcode === 'object' && p.barcode !== null ? (p.barcode as any).value : (p.barcode || '---');
            const minor = typeof p.priceMinor === 'object' && p.priceMinor !== null ? (p.priceMinor as any).cents : (p.priceMinor || 0);
            const major = typeof p.priceMajor === 'object' && p.priceMajor !== null ? (p.priceMajor as any).cents : (p.priceMajor || 0);

            let stockBadgeBg = '#dcfce7';
            let stockBadgeColor = '#16a34a';
            let stockText = `${p.stock} u.`;

            if (p.stock <= 0) {
              stockBadgeBg = '#fee2e2';
              stockBadgeColor = '#dc2626';
              stockText = '0 u. (Agotado)';
            } else if (p.stock <= 5) {
              stockBadgeBg = '#fef3c7';
              stockBadgeColor = '#b45309';
              stockText = `${p.stock} u. (Bajo)`;
            }

            return (
              <tr key={p.id}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-muted)' }}>{barcode}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ fontWeight: 700, color: '#0369a1' }}>${(minor / 100).toFixed(2)}</td>
                <td>${(major / 100).toFixed(2)}</td>
                <td>
                  <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, background: stockBadgeBg, color: stockBadgeColor, display: 'inline-block' }}>
                    {stockText}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => onViewPriceHistory(p)} title="Historial de Actualizaciones de Precios"><History size={15} color="#0284c7" /></button>
                    <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => onEdit(p)} title="Editar"><Edit2 size={15} /></button>
                    <button className="btn btn-secondary" style={{ padding: '5px', color: 'var(--danger)' }} onClick={() => onDelete(p.id)} title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
