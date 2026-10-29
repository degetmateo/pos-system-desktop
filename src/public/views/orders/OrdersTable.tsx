import React from 'react';
import { Eye, Printer, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { OrderDto } from '../../types/api.types';

interface OrdersTableProps {
  orders: OrderDto[];
  loading: boolean;
  sortKey: string;
  onSortChange: (newSortKey: string) => void;
  onSelectOrder: (order: OrderDto) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  sortKey,
  onSortChange,
  onSelectOrder,
}) => {
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando órdenes...</div>;
  }
  if (orders.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron órdenes con los filtros seleccionados.</div>;
  }

  const renderSortIcon = (ascKey: string, descKey: string) => {
    if (sortKey === ascKey) return <ArrowUp size={14} color="var(--brand-celeste-hover)" />;
    if (sortKey === descKey) return <ArrowDown size={14} color="var(--brand-celeste-hover)" />;
    return <ArrowUpDown size={14} style={{ opacity: 0.35 }} />;
  };

  const handleHeaderClick = (ascKey: string, descKey: string) => {
    if (sortKey === descKey) {
      onSortChange(ascKey);
    } else {
      onSortChange(descKey);
    }
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('number_asc', 'number_desc')}
              title="Ordenar por N° de orden"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>N°</span>
                {renderSortIcon('number_asc', 'number_desc')}
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('created_at_asc', 'created_at_desc')}
              title="Ordenar por Fecha"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Fecha</span>
                {renderSortIcon('created_at_asc', 'created_at_desc')}
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('customer_asc', 'customer_desc')}
              title="Ordenar por Cliente"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Cliente</span>
                {renderSortIcon('customer_asc', 'customer_desc')}
              </div>
            </th>
            <th>Tipo</th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('total_asc', 'total_desc')}
              title="Ordenar por Total"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Total</span>
                {renderSortIcon('total_asc', 'total_desc')}
              </div>
            </th>
            <th>Pago</th>
            <th style={{ width: '110px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const typeStr = typeof o.type === 'object' && o.type !== null ? (o.type as any).code : o.type;
            const rawPayment = typeof o.paymentMethod === 'object' && o.paymentMethod !== null ? (o.paymentMethod as any).code : (o.paymentMethod || '---');
            const paymentLabels: Record<string, string> = {
              cash: 'Efectivo',
              transfer: 'Transferencia',
              card: 'Tarjeta',
              current_account: 'Cta. Cte.',
            };
            const paymentStr = paymentLabels[rawPayment] || rawPayment;
            const totalCents = typeof o.totalPrice === 'object' && o.totalPrice !== null ? (o.totalPrice as any).cents : (o.totalPrice || 0);

            return (
              <tr key={o.id}>
                <td style={{ fontWeight: 800 }}>#{o.number}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {new Date(o.createdAt).toLocaleString(undefined, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td style={{ fontWeight: 600 }}>{o.customer?.name || 'Consumidor Final'}</td>
                <td>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: typeStr === 'major' ? '#eff6ff' : '#f0fdf4', color: typeStr === 'major' ? '#1d4ed8' : '#15803d' }}>
                    {typeStr === 'major' ? 'MAYORISTA' : 'MINORISTA'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--brand-dark)' }}>${(totalCents / 100).toFixed(2)}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  <span style={{ textTransform: 'capitalize', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                    {paymentStr}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => onSelectOrder(o)} title="Ver Detalle"><Eye size={15} /></button>
                    <a href={`/api/orders/receipt/${o.id}?action=print`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '5px' }} title="Imprimir"><Printer size={15} /></a>
                    <a href={`/api/orders/receipt/${o.id}?action=save`} download className="btn btn-secondary" style={{ padding: '5px' }} title="Descargar"><Download size={15} /></a>
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
