import { Database as DatabaseInstance } from 'better-sqlite3';
import { StatisticsOverviewDto, StatisticsQueryRange } from '../../application/dtos/statistics.dto';
import { IStatisticsRepository } from '../../application/ports/statistics-repository.port';
import { SqliteProductStatsQuery } from './stats/sqlite-product-stats.query';
import { SqliteSalesStatsQuery } from './stats/sqlite-sales-stats.query';

export class SqliteStatisticsRepository implements IStatisticsRepository {
  private readonly salesQuery: SqliteSalesStatsQuery;
  private readonly productQuery: SqliteProductStatsQuery;

  constructor(db: DatabaseInstance) {
    this.salesQuery = new SqliteSalesStatsQuery(db);
    this.productQuery = new SqliteProductStatsQuery(db);
  }

  public async getOverview(range: StatisticsQueryRange): Promise<StatisticsOverviewDto> {
    const orderKpis = this.salesQuery.getOrderTotals(range);
    const catalogKpis = this.productQuery.getCatalogAndPriceKpis(range);

    return {
      period: {
        startDate: range.startIso,
        endDate: range.endIso,
        label: range.label,
      },
      kpis: {
        ...orderKpis,
        ...catalogKpis,
      },
      salesSeries: this.salesQuery.getSalesSeries(range),
      paymentBreakdown: this.salesQuery.getPaymentBreakdown(range),
      topCustomers: this.salesQuery.getTopCustomers(range, 10),
      topProducts: this.productQuery.getTopProducts(range, 10),
      productPriceSummary: this.productQuery.getPriceSummary(),
      recentPriceChanges: this.productQuery.getRecentPriceChanges(range, 15),
    };
  }
}

