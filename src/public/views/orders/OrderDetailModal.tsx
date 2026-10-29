import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { OrderDto } from '../../types/api.types';

interface OrderDetailModalProps {
  order: OrderDto | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const printUrl = `/api/orders/receipt/${order.id}?action=print`;
  const saveUrl = `/api/orders/receipt/${order.id}?action=save`;
  const typeStr = typeof order.type === 'object' && order.type !== null ? (order.type as any).code : order.type;
  const paymentStr = typeof order.paymentMethod === 'object' && order.paymentMethod !== null ? (order.paymentMethod as any).code : (order.paymentMethod || 'Sin asignar');
  const totalCents = typeof order.totalPrice === 'object' && order.totalPrice !== null ? (order.totalPrice as any).cents : (order.totalPrice || 0);
  const advancementCents = typeof order.advancement === 'object' && order.advancement !== null ? (order.advancement as any).cents : (order.advancement || 0);
  const balance = Math.max(0, totalCents - advancementCents);
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Comprobante N° {order.number}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.9rem' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Cliente:</span> <div style={{ fontWeight: 600 }}>{order.customer?.name || 'Consumidor Final'}</div></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Tipo:</span> <div style={{ fontWeight: 600 }}>{typeStr === 'major' ? 'MAYORISTA' : 'MINORISTA'}</div></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Pago:</span> <div style={{ fontWeight: 600 }}>{paymentStr}</div></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Total:</span> <div style={{ fontWeight: 800, color: 'var(--brand-dark)' }}>${(totalCents / 100).toFixed(2)}</div></div>
          {advancementCents > 0 && (
            <div><span style={{ color: 'var(--text-muted)' }}>Adelanto:</span> <div style={{ fontWeight: 700, color: '#0369a1' }}>${(advancementCents / 100).toFixed(2)}</div></div>
          )}
          {balance > 0 && advancementCents > 0 && (
            <div><span style={{ color: 'var(--text-muted)' }}>Saldo:</span> <div style={{ fontWeight: 700, color: 'var(--danger)' }}>${(balance / 100).toFixed(2)}</div></div>
          )}
        </div>

        <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio U.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const unitPrice = typeof it.unitPrice === 'number' ? it.unitPrice : (typeof (it as any).price === 'number' ? (it as any).price : 0);
                const discountPrice = typeof it.discountPrice === 'number' ? it.discountPrice : (typeof (it as any).discountPrice?.cents === 'number' ? (it as any).discountPrice.cents : null);
                const effectivePrice = discountPrice !== null ? discountPrice : unitPrice;
                const sub = effectivePrice * it.quantity;
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{it.productName}</td>
                    <td>{it.quantity}</td>
                    <td>${(effectivePrice / 100).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>${(sub / 100).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <a href={printUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
            <Printer size={16} /> Imprimir Comprobante
          </a>
          <a href={saveUrl} download className="btn btn-secondary">
            <Download size={16} /> Descargar PDF
          </a>
        </div>
      </div>
    </div>
  );
};

