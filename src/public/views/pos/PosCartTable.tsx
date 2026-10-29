import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from './pos.types';

interface PosCartTableProps {
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const PosCartTable: React.FC<PosCartTableProps> = ({ items, onUpdateQty, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>El carrito está vacío</p>
        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Escanee un código de barras o busque un producto manualmente.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop View: Full Table */}
      <div className="cart-desktop-table table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio U.</th>
              <th style={{ textAlign: 'center' }}>Cantidad</th>
              <th>Subtotal</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const hasDiscount = it.effectivePrice < it.basePrice;
              const subtotal = (it.effectivePrice * it.quantity) / 100;
              const barcode = typeof it.product.barcode === 'object' && it.product.barcode !== null ? (it.product.barcode as any).value : (it.product.barcode || 'Sin código');
              return (
                <tr key={it.product.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{it.product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{barcode}</div>
                  </td>
                  <td>
                    <div>${(it.effectivePrice / 100).toFixed(2)}</div>
                    {hasDiscount && (
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                        Desc. aplicado (-${((it.basePrice - it.effectivePrice) / 100).toFixed(2)})
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => onUpdateQty(it.product.id, -1)}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{it.quantity}</span>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => onUpdateQty(it.product.id, 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--danger)' }} onClick={() => onRemoveItem(it.product.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Touch-Friendly Responsive Cards */}
      <div className="cart-mobile-cards">
        {items.map((it) => {
          const hasDiscount = it.effectivePrice < it.basePrice;
          const subtotal = (it.effectivePrice * it.quantity) / 100;
          const barcode = typeof it.product.barcode === 'object' && it.product.barcode !== null ? (it.product.barcode as any).value : (it.product.barcode || 'Sin código');
          return (
            <div key={it.product.id} className="cart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--brand-dark)', wordBreak: 'break-word' }}>
                    {it.product.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{barcode}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px', color: 'var(--danger)', flexShrink: 0 }}
                  onClick={() => onRemoveItem(it.product.id)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ${(it.effectivePrice / 100).toFixed(2)} c/u
                  </div>
                  {hasDiscount && (
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                      Desc. (-${((it.basePrice - it.effectivePrice) / 100).toFixed(2)})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#f8fafc' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', border: 'none', background: 'transparent' }} onClick={() => onUpdateQty(it.product.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 800, minWidth: '26px', textAlign: 'center', fontSize: '0.95rem' }}>{it.quantity}</span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', border: 'none', background: 'transparent' }} onClick={() => onUpdateQty(it.product.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0369a1', minWidth: '65px', textAlign: 'right' }}>
                    ${subtotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
