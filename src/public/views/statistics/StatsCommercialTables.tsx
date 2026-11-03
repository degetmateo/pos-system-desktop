import React from 'react';
import { TopCustomerStatDto, TopProductStatDto } from '../../types/statistics.types';
import { ImportanceBadge, formatArsFromCents } from '../../components/ImportanceBadge';

interface StatsCommercialTablesProps {
  topCustomers: TopCustomerStatDto[];
  topProducts: TopProductStatDto[];
}

export const StatsCommercialTables: React.FC<StatsCommercialTablesProps> = ({ topCustomers, topProducts }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
    <div className="card">
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Top Compras de Clientes</h3>
      {topCustomers.length === 0 ? (
        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay compras vinculadas a clientes en el período.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente / WSP</th>
                <th>Importancia</th>
                <th>Órd.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{c.name}</div>
                    {c.whatsappName && <div style={{ fontSize: '0.74rem', color: '#008069' }}>WSP: {c.whatsappName}</div>}
                  </td>
                  <td><ImportanceBadge importance={c.importance} compact /></td>
                  <td style={{ fontWeight: 700 }}>{c.ordersCount}</td>
                  <td style={{ fontWeight: 700, color: '#0369a1' }}>{formatArsFromCents(c.totalSpentCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <div className="card">
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Productos Más Vendidos</h3>
      {topProducts.length === 0 ? (
        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin ítems facturados en este período.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Unid.</th>
                <th>Órd.</th>
                <th>Facturación</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.productId}>
                  <td style={{ fontWeight: 600, fontSize: '0.86rem' }}>{p.productName}</td>
                  <td style={{ fontWeight: 700 }}>{p.unitsSold}</td>
                  <td>{p.ordersCount}</td>
                  <td style={{ fontWeight: 700, color: '#059669' }}>{formatArsFromCents(p.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

