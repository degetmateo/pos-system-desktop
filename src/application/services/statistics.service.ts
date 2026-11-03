import { StatisticsOverviewDto, StatisticsQueryRange } from '../dtos/statistics.dto';
import { IStatisticsRepository } from '../ports/statistics-repository.port';

export interface StatisticsRequestParams {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export class StatisticsService {
  constructor(private readonly statsRepo: IStatisticsRepository) {}

  public async getOverview(params?: StatisticsRequestParams): Promise<StatisticsOverviewDto> {
    const range = this.resolveRange(params);
    return this.statsRepo.getOverview(range);
  }

  private resolveRange(params?: StatisticsRequestParams): StatisticsQueryRange {
    const now = new Date();
    if (params?.startDate || params?.endDate) {
      const start = params.startDate ? new Date(`${params.startDate.slice(0, 10)}T00:00:00.000Z`) : null;
      const end = params.endDate ? new Date(`${params.endDate.slice(0, 10)}T23:59:59.999Z`) : null;
      return {
        startIso: start && !Number.isNaN(start.getTime()) ? start.toISOString() : null,
        endIso: end && !Number.isNaN(end.getTime()) ? end.toISOString() : null,
        startMs: start && !Number.isNaN(start.getTime()) ? start.getTime() : null,
        endMs: end && !Number.isNaN(end.getTime()) ? end.getTime() : null,
        label: 'Rango personalizado',
      };
    }

    const period = (params?.period || '30d').toLowerCase();
    const presets: Record<string, { days: number | null; label: string }> = {
      '7d': { days: 7, label: 'Últimos 7 días' },
      '30d': { days: 30, label: 'Últimos 30 días' },
      '90d': { days: 90, label: 'Últimos 90 días' },
      '365d': { days: 365, label: 'Último año' },
      all: { days: null, label: 'Histórico completo' },
    };
    const chosen = presets[period] || presets['30d'];
    if (chosen.days === null) {
      return { startIso: null, endIso: null, startMs: null, endMs: null, label: chosen.label };
    }

    const start = new Date(now.getTime() - chosen.days * 24 * 60 * 60 * 1000);
    return {
      startIso: start.toISOString(),
      endIso: now.toISOString(),
      startMs: start.getTime(),
      endMs: now.getTime(),
      label: chosen.label,
    };
  }
}

