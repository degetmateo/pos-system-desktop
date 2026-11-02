import { OrderFilters } from '../../../application/ports/order-repository.port';
import { SqliteSearchRelevanceBuilder } from './sqlite-search-relevance.builder';

export interface BuiltOrderQuery {
  selectSql: string;
  countSql: string;
  selectParams: unknown[];
  countParams: unknown[];
}

export class OrderQueryBuilder {
  public static build(f?: OrderFilters): BuiltOrderQuery {
    const parts: string[] = ['1 = 1'];
    const otherParams: unknown[] = [];

    if (f?.id) { parts.push('o.id = ?'); otherParams.push(f.id); }
    if (f?.customerId) { parts.push('o.customer_id = ?'); otherParams.push(f.customerId); }
    if (f?.orderNumber) { parts.push('o.number = ?'); otherParams.push(f.orderNumber); }
    if (f?.type) { parts.push('o.type = ?'); otherParams.push(f.type); }
    if (f?.status) { parts.push('o.status = ?'); otherParams.push(f.status); }
    if (f?.paymentMethod) { parts.push('o.payment_method = ?'); otherParams.push(f.paymentMethod); }
    if (f?.startDate) { parts.push('date(o.created_at) >= date(?)'); otherParams.push(f.startDate); }
    if (f?.endDate) { parts.push('date(o.created_at) <= date(?)'); otherParams.push(f.endDate); }
    if (f?.minTotal !== undefined && f?.minTotal !== null) { parts.push('o.total_price >= ?'); otherParams.push(f.minTotal); }
    if (f?.maxTotal !== undefined && f?.maxTotal !== null) { parts.push('o.total_price <= ?'); otherParams.push(f.maxTotal); }

    const searchTerm = f?.search?.trim() || f?.customerName?.trim();
    let hasSearch = false;
    let scoreSelect = '';
    const scoreParams: unknown[] = [];
    const searchWhereParams: unknown[] = [];

    if (searchTerm) {
      const numMatch = searchTerm.replace(/^#/, '');
      const isNum = /^\d+$/.test(numMatch);
      const rel = SqliteSearchRelevanceBuilder.build(searchTerm, ['c.name', 'c.cuil']);

      if (isNum && rel.hasSearch) {
        hasSearch = true;
        parts.push(`(o.number = ? OR ${rel.whereClause})`);
        searchWhereParams.push(Number(numMatch), ...rel.whereParams);
        const innerScore = rel.scoreSelect.replace(/\s+AS\s+match_score$/i, '');
        scoreSelect = `(((o.number = ?) * 15) + ${innerScore}) AS match_score`;
        scoreParams.push(Number(numMatch), ...rel.scoreParams);
      } else if (isNum) {
        hasSearch = true;
        parts.push('o.number = ?');
        searchWhereParams.push(Number(numMatch));
        scoreSelect = '((o.number = ?) * 10) AS match_score';
        scoreParams.push(Number(numMatch));
      } else if (rel.hasSearch) {
        hasSearch = true;
        parts.push(rel.whereClause);
        searchWhereParams.push(...rel.whereParams);
        scoreSelect = rel.scoreSelect;
        scoreParams.push(...rel.scoreParams);
      }
    }

    const whereClause = `WHERE ${parts.join(' AND ')}`;
    const baseOrder = this.resolveOrderBy(f?.sorting);
    const finalOrder = hasSearch
      ? `ORDER BY match_score DESC, ${baseOrder.replace(/^ORDER BY\s+/i, '')}`
      : baseOrder;

    const fromClause = 'FROM orders o LEFT JOIN customers c ON o.customer_id = c.id';
    const selectProjection = hasSearch
      ? `o.*, c.name as customer_name, c.cuil as customer_cuil, ${scoreSelect}`
      : 'o.*, c.name as customer_name, c.cuil as customer_cuil';

    let selectSql = `SELECT ${selectProjection} ${fromClause} ${whereClause} ${finalOrder}`;
    const selectParams: unknown[] = hasSearch
      ? [...scoreParams, ...otherParams, ...searchWhereParams]
      : [...otherParams];

    if (f?.limit) {
      selectSql += ' LIMIT ? OFFSET ?';
      selectParams.push(f.limit, f.offset || 0);
    }

    const countSql = `SELECT COUNT(*) as total ${fromClause} ${whereClause}`;
    const countParams = hasSearch ? [...otherParams, ...searchWhereParams] : [...otherParams];

    return { selectSql, countSql, selectParams, countParams };
  }

  public static resolveOrderBy(sorting?: string | null): string {
    switch (sorting) {
      case 'created_at_desc': return 'ORDER BY o.created_at DESC';
      case 'created_at_asc': return 'ORDER BY o.created_at ASC';
      case 'number_desc': return 'ORDER BY o.number DESC';
      case 'number_asc': return 'ORDER BY o.number ASC';
      case 'total_desc': return 'ORDER BY o.total_price DESC';
      case 'total_asc': return 'ORDER BY o.total_price ASC';
      case 'customer_asc': return 'ORDER BY COALESCE(c.name, "Consumidor Final") COLLATE NOCASE ASC';
      case 'customer_desc': return 'ORDER BY COALESCE(c.name, "Consumidor Final") COLLATE NOCASE DESC';
      default: return 'ORDER BY o.created_at DESC';
    }
  }
}

