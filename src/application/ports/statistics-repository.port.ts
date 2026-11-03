import { StatisticsOverviewDto, StatisticsQueryRange } from '../dtos/statistics.dto';

export interface IStatisticsRepository {
  getOverview(range: StatisticsQueryRange): Promise<StatisticsOverviewDto>;
}

