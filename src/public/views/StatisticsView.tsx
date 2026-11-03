import React, { useEffect, useState } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { ApiClient } from '../services/api.client';
import { ToastService } from '../services/toast.service';
import { StatisticsOverviewDto } from '../types/statistics.types';
import { StatsKpiGrid } from './statistics/StatsKpiGrid';
import { StatsSalesCharts } from './statistics/StatsSalesCharts';
import { StatsCommercialTables } from './statistics/StatsCommercialTables';
import { StatsPriceAnalytics } from './statistics/StatsPriceAnalytics';
import { StatsWhatsappPanel } from './statistics/StatsWhatsappPanel';

const PERIODS = [
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
  { id: '365d', label: '1 año' },
  { id: 'all', label: 'Todo' },
];

export const StatisticsView: React.FC = () => {
  const [period, setPeriod] = useState<string>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<StatisticsOverviewDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async (p = period, s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (s || e) {
        if (s) params.startDate = s;
        if (e) params.endDate = e;
      } else {
        params.period = p;
      }
      setData(await ApiClient.getStatistics(params));
    } catch (err: any) {
      ToastService.error(err.message || 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats(period, '', '');
  }, [period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Estadísticas y Analítica</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ventas, compras de clientes, variaciones de precios y mensajería de WhatsApp ({data?.period.label || 'Cargando...'})
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '2px' }}>
            {PERIODS.map((pr) => (
              <button
                key={pr.id}
                type="button"
                className="btn"
                style={{
                  padding: '5px 10px', fontSize: '0.8rem',
                  background: !startDate && !endDate && period === pr.id ? '#fff' : 'transparent',
                  color: 'var(--text-primary)',
                }}
                onClick={() => { setStartDate(''); setEndDate(''); setPeriod(pr.id); }}
              >
                {pr.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Calendar size={14} color="var(--text-muted)" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ border: 'none', fontSize: '0.8rem', outline: 'none' }} title="Desde" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>a</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ border: 'none', fontSize: '0.8rem', outline: 'none' }} title="Hasta" />
            {(startDate || endDate) && (
              <button type="button" className="btn btn-primary" style={{ padding: '4px 9px', fontSize: '0.76rem' }} onClick={() => void fetchStats(period, startDate, endDate)}>
                Filtrar
              </button>
            )}
          </div>

          <button type="button" className="btn btn-secondary" style={{ padding: '7px 10px' }} onClick={() => void fetchStats()} title="Actualizar métricas">
            <RefreshCw size={15} className={loading ? 'wa-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Calculando métricas y gráficos...</div>
      ) : data ? (
        <>
          <StatsKpiGrid kpis={data.kpis} />
          <StatsSalesCharts salesSeries={data.salesSeries} paymentBreakdown={data.paymentBreakdown} />
          <StatsCommercialTables topCustomers={data.topCustomers} topProducts={data.topProducts} />
          <StatsPriceAnalytics summary={data.productPriceSummary} recentChanges={data.recentPriceChanges} />
          <StatsWhatsappPanel dailySeries={data.whatsappDailySeries} topContacts={data.whatsappTopContacts} />
        </>
      ) : null}
    </div>
  );
};

