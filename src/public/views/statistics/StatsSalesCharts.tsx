import React, { useMemo } from 'react';
import { ChartConfiguration } from 'chart.js';
import { PaymentBreakdownItemDto, SalesSeriesPointDto } from '../../types/statistics.types';
import { ChartCanvas } from './ChartCanvas';
import { formatArsFromCents } from '../../components/ImportanceBadge';

interface StatsSalesChartsProps {
  salesSeries: SalesSeriesPointDto[];
  paymentBreakdown: PaymentBreakdownItemDto[];
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  debit: 'Débito',
  credit: 'Crédito',
  unspecified: 'Sin especificar',
};

export const StatsSalesCharts: React.FC<StatsSalesChartsProps> = ({ salesSeries, paymentBreakdown }) => {
  const salesConfig = useMemo<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: salesSeries.map((p) => p.date.slice(5)),
      datasets: [
        {
          type: 'bar',
          label: 'Minorista ($)',
          data: salesSeries.map((p) => Math.round(p.minorRevenueCents / 100)),
          backgroundColor: 'rgba(14, 165, 233, 0.75)',
          borderRadius: 4,
        },
        {
          type: 'bar',
          label: 'Mayorista ($)',
          data: salesSeries.map((p) => Math.round(p.majorRevenueCents / 100)),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
    },
  }), [salesSeries]);

  const paymentConfig = useMemo<ChartConfiguration>(() => ({
    type: 'doughnut',
    data: {
      labels: paymentBreakdown.map((p) => PAYMENT_LABELS[p.method] || p.method),
      datasets: [{
        data: paymentBreakdown.map((p) => Math.round(p.revenueCents / 100)),
        backgroundColor: ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'],
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
  }), [paymentBreakdown]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
      <div className="card" style={{ gridColumn: 'span 1' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Evolución de Ventas (Minorista vs Mayorista)</h3>
        {salesSeries.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin órdenes registradas en este período.</div>
        ) : (
          <ChartCanvas config={salesConfig} height={260} />
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Medios de Pago</h3>
        {paymentBreakdown.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin cobros registrados en este período.</div>
        ) : (
          <>
            <ChartCanvas config={paymentConfig} height={200} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', fontSize: '0.82rem' }}>
              {paymentBreakdown.map((p) => (
                <div key={p.method} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{PAYMENT_LABELS[p.method] || p.method} ({p.ordersCount} órd.)</span>
                  <strong>{formatArsFromCents(p.revenueCents)}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

