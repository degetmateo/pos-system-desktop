import React, { useMemo } from 'react';
import { ChartConfiguration } from 'chart.js';
import { WhatsappContactStatDto, WhatsappDailyPointDto } from '../../types/statistics.types';
import { ChartCanvas } from './ChartCanvas';
import { ImportanceBadge } from '../../components/ImportanceBadge';

interface StatsWhatsappPanelProps {
  dailySeries: WhatsappDailyPointDto[];
  topContacts: WhatsappContactStatDto[];
}

export const StatsWhatsappPanel: React.FC<StatsWhatsappPanelProps> = ({ dailySeries, topContacts }) => {
  const chartConfig = useMemo<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: dailySeries.map((d) => d.date.slice(5)),
      datasets: [
        {
          label: 'Recibidos',
          data: dailySeries.map((d) => d.incomingCount),
          backgroundColor: 'rgba(0, 168, 132, 0.8)',
          borderRadius: 4,
        },
        {
          label: 'Enviados',
          data: dailySeries.map((d) => d.outgoingCount),
          backgroundColor: 'rgba(2, 132, 199, 0.75)',
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
  }), [dailySeries]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Mensajes de WhatsApp por Día</h3>
        {dailySeries.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin mensajes en este rango de fechas.</div>
        ) : (
          <ChartCanvas config={chartConfig} height={250} />
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Actividad por Contacto / Cliente</h3>
        {topContacts.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin conversaciones registradas en este período.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Imp.</th>
                  <th>Recib. / Env.</th>
                  <th>Total</th>
                  <th>Último Msj.</th>
                </tr>
              </thead>
              <tbody>
                {topContacts.map((c) => (
                  <tr key={c.jid}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</div>
                      {c.phone && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>+{c.phone.replace(/^\+/, '')}</div>}
                    </td>
                    <td><ImportanceBadge importance={c.importance} compact /></td>
                    <td style={{ fontSize: '0.82rem' }}>{c.incomingCount} / {c.outgoingCount}</td>
                    <td style={{ fontWeight: 700, color: '#008069' }}>{c.totalMessages}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {c.lastMessageTimestamp ? new Date(c.lastMessageTimestamp).toLocaleDateString('es-AR') : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

