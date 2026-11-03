import React from 'react';
import { DollarSign, ShoppingBag, MessageCircle, Package } from 'lucide-react';
import { StatisticsKpisDto } from '../../types/statistics.types';
import { formatArsFromCents } from '../../components/ImportanceBadge';

interface StatsKpiGridProps {
  kpis: StatisticsKpisDto;
}

export const StatsKpiGrid: React.FC<StatsKpiGridProps> = ({ kpis }) => {
  const cards = [
    {
      title: 'Facturación del Período',
      value: formatArsFromCents(kpis.totalRevenueCents),
      sub: `Ticket prom.: ${formatArsFromCents(kpis.averageTicketCents)}`,
      detail: `Min: ${formatArsFromCents(kpis.minorRevenueCents)} • May: ${formatArsFromCents(kpis.majorRevenueCents)}`,
      icon: <DollarSign size={22} color="#0284c7" />,
      bg: '#e0f2fe',
    },
    {
      title: 'Órdenes Emitidas',
      value: String(kpis.totalOrdersCount),
      sub: `${kpis.minorOrdersCount} minoristas • ${kpis.majorOrdersCount} mayoristas`,
      detail: `${kpis.priorityCustomersCount} clientes prioritarios activos`,
      icon: <ShoppingBag size={22} color="#059669" />,
      bg: '#d1fae5',
    },
    {
      title: 'Mensajes de WhatsApp',
      value: String(kpis.totalMessagesCount),
      sub: `${kpis.incomingMessagesCount} recibidos • ${kpis.outgoingMessagesCount} enviados`,
      detail: `${kpis.activeWhatsappChatsCount} conversaciones con actividad`,
      icon: <MessageCircle size={22} color="#008069" />,
      bg: '#ccfbf1',
    },
    {
      title: 'Catálogo y Precios',
      value: `${kpis.totalProductsCount} prod.`,
      sub: `${kpis.priceChangesCount} actualizaciones de precio en período`,
      detail: `${kpis.totalCustomersCount} clientes registrados en BD`,
      icon: <Package size={22} color="#7c3aed" />,
      bg: '#ede9fe',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))', gap: '14px' }}>
      {cards.map((c) => (
        <div key={c.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>{c.title}</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {c.icon}
            </div>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--brand-dark)' }}>{c.value}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{c.sub}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{c.detail}</div>
        </div>
      ))}
    </div>
  );
};

