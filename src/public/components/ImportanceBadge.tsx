import React from 'react';
import { CustomerImportanceCode } from '../types/api.types';

const BADGE_STYLES: Record<CustomerImportanceCode, { label: string; bg: string; color: string; border: string }> = {
  important: { label: 'Importante', bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
  normal: { label: 'Normal', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  low: { label: 'Poca imp.', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  ignore: { label: 'Ignorar', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
};

export const ImportanceBadge: React.FC<{
  importance?: CustomerImportanceCode | string | null;
  hideNormal?: boolean;
  compact?: boolean;
}> = ({ importance, hideNormal = false, compact = false }) => {
  const code = ((importance || 'normal').toLowerCase() as CustomerImportanceCode);
  if (hideNormal && code === 'normal') return null;
  const cfg = BADGE_STYLES[code] || BADGE_STYLES.normal;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: compact ? '1px 6px' : '2px 8px',
        borderRadius: '10px',
        fontSize: compact ? '0.68rem' : '0.75rem',
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
};

export function formatArsFromCents(cents: number = 0): string {
  return (cents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export const PriorityBuyerBadge: React.FC<{
  isPriority?: boolean;
  ordersCount?: number;
  totalSpentCents?: number;
  compact?: boolean;
}> = ({ isPriority, ordersCount = 0, totalSpentCents = 0, compact = false }) => {
  if (!isPriority && ordersCount <= 0) return null;

  if (isPriority) {
    return (
      <span
        title={`Cliente prioritario: ${ordersCount} compras (${formatArsFromCents(totalSpentCents)})`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: compact ? '1px 6px' : '2px 8px',
          borderRadius: '10px',
          fontSize: compact ? '0.68rem' : '0.74rem',
          fontWeight: 700,
          background: '#dcfce7',
          color: '#166534',
          border: '1px solid #86efac',
          whiteSpace: 'nowrap',
        }}
      >
        ★ Prioritario {compact ? `(${ordersCount})` : `· ${ordersCount} compras (${formatArsFromCents(totalSpentCents)})`}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '1px 6px',
        borderRadius: '10px',
        fontSize: '0.68rem',
        fontWeight: 600,
        background: '#f8fafc',
        color: '#475569',
        border: '1px solid #e2e8f0',
        whiteSpace: 'nowrap',
      }}
    >
      {ordersCount} {ordersCount === 1 ? 'compra' : 'compras'}
    </span>
  );
};

