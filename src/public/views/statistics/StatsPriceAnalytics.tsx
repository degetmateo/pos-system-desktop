import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ProductPriceSummaryDto, RecentPriceChangeDto } from '../../types/statistics.types';
import { formatArsFromCents } from '../../components/ImportanceBadge';

interface StatsPriceAnalyticsProps {
  summary: ProductPriceSummaryDto;
  recentChanges: RecentPriceChangeDto[];
}

export const StatsPriceAnalytics: React.FC<StatsPriceAnalyticsProps> = ({ summary, recentChanges }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Estadísticas de Precios de Productos y Variaciones</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem' }}>
        <span style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>
          Minorista Prom.: {formatArsFromCents(summary.avgMinorCents)} (Min: {formatArsFromCents(summary.minMinorCents)} • Máx: {formatArsFromCents(summary.maxMinorCents)})
        </span>
        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>
          Mayorista Prom.: {formatArsFromCents(summary.avgMajorCents)} (Min: {formatArsFromCents(summary.minMajorCents)} • Máx: {formatArsFromCents(summary.maxMajorCents)})
        </span>
      </div>
    </div>

    {recentChanges.length === 0 ? (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
        No se registraron cambios de precios en el período seleccionado.
      </div>
    ) : (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Lista</th>
              <th>Precio Anterior</th>
              <th>Precio Nuevo</th>
              <th>Variación</th>
            </tr>
          </thead>
          <tbody>
            {recentChanges.map((ch) => {
              const up = ch.percentageDiff >= 0;
              return (
                <tr key={ch.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(ch.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.86rem' }}>{ch.productName}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ch.priceType === 'major' ? '#1d4ed8' : '#15803d' }}>
                      {ch.priceType === 'major' ? 'Mayorista' : 'Minorista'}
                    </span>
                  </td>
                  <td>{formatArsFromCents(ch.oldPriceCents)}</td>
                  <td style={{ fontWeight: 700 }}>{formatArsFromCents(ch.newPriceCents)}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.82rem', color: up ? '#dc2626' : '#16a34a' }}>
                      {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {up ? '+' : ''}{Number(ch.percentageDiff).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

