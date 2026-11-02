import { CustomerFilters } from '../../../application/ports/customer-repository.port';
import { SqliteSearchRelevanceBuilder } from './sqlite-search-relevance.builder';

export interface BuiltCustomerQuery {
  selectSql: string;
  countSql: string;
  selectParams: unknown[];
  countParams: unknown[];
}

export class CustomerQueryBuilder {
  public static build(filters?: CustomerFilters): BuiltCustomerQuery {
    const searchTerm = filters?.search?.trim() || filters?.name?.trim();
    const rel = SqliteSearchRelevanceBuilder.build(searchTerm, ['name', 'cuil', 'phone', 'email', 'address']);

    const whereParts: string[] = ['1 = 1'];
    const otherParams: unknown[] = [];

    if (filters?.id) {
      whereParts.push('id = ?');
      otherParams.push(filters.id);
    }
    if (filters?.type) {
      whereParts.push('default_order_type = ?');
      otherParams.push(filters.type);
    }
    if (filters?.hasCuil !== undefined && filters?.hasCuil !== null) {
      whereParts.push(filters.hasCuil ? 'cuil IS NOT NULL AND TRIM(cuil) != ""' : '(cuil IS NULL OR TRIM(cuil) = "")');
    }
    if (filters?.hasPhone !== undefined && filters?.hasPhone !== null) {
      whereParts.push(filters.hasPhone ? 'phone IS NOT NULL AND TRIM(phone) != ""' : '(phone IS NULL OR TRIM(phone) = "")');
    }
    if (filters?.hasEmail !== undefined && filters?.hasEmail !== null) {
      whereParts.push(filters.hasEmail ? 'email IS NOT NULL AND TRIM(email) != ""' : '(email IS NULL OR TRIM(email) = "")');
    }

    if (rel.hasSearch) {
      whereParts.push(rel.whereClause);
    }

    const whereClause = `WHERE ${whereParts.join(' AND ')}`;
    const baseOrder = this.resolveOrderBy(filters?.sorting);
    const finalOrder = rel.orderClause(baseOrder);

    const selectProjection = rel.hasSearch ? `*, ${rel.scoreSelect}` : '*';
    let selectSql = `SELECT ${selectProjection} FROM customers ${whereClause} ${finalOrder}`;
    const selectParams: unknown[] = rel.hasSearch
      ? [...rel.scoreParams, ...otherParams, ...rel.whereParams]
      : [...otherParams];

    if (filters?.limit) {
      selectSql += ' LIMIT ? OFFSET ?';
      selectParams.push(filters.limit, filters.offset || 0);
    }

    const countSql = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const countParams = rel.hasSearch ? [...otherParams, ...rel.whereParams] : [...otherParams];

    return { selectSql, countSql, selectParams, countParams };
  }

  public static resolveOrderBy(sorting?: string | null): string {
    switch (sorting) {
      case 'abc':
      case 'name_asc': return 'ORDER BY name COLLATE NOCASE ASC';
      case 'name_desc': return 'ORDER BY name COLLATE NOCASE DESC';
      case 'created_at_desc': return 'ORDER BY created_at DESC';
      case 'created_at_asc':
      case 'created_at': return 'ORDER BY created_at ASC';
      case 'cuil_asc': return 'ORDER BY cuil ASC';
      case 'cuil_desc': return 'ORDER BY cuil DESC';
      default: return 'ORDER BY name COLLATE NOCASE ASC';
    }
  }
}

