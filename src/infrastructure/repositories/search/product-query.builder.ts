import { ProductFilters } from '../../../application/ports/product-repository.port';
import { SqliteSearchRelevanceBuilder } from './sqlite-search-relevance.builder';

export interface BuiltProductQuery {
  selectSql: string;
  countSql: string;
  selectParams: unknown[];
  countParams: unknown[];
}

export class ProductQueryBuilder {
  public static build(filters?: ProductFilters): BuiltProductQuery {
    const searchTerm = filters?.search?.trim() || filters?.name?.trim();
    const rel = SqliteSearchRelevanceBuilder.build(searchTerm, ['name', 'barcode', 'description']);

    const whereParts: string[] = ['deleted = 0'];
    const otherParams: unknown[] = [];

    if (filters?.id) {
      whereParts.push('id = ?');
      otherParams.push(filters.id);
    }
    if (filters?.barcode) {
      whereParts.push('barcode = ?');
      otherParams.push(filters.barcode);
    }
    if (filters?.providerId) {
      if (filters.providerId === 'none') {
        whereParts.push('(provider_id IS NULL OR provider_id = "")');
      } else {
        whereParts.push('provider_id = ?');
        otherParams.push(filters.providerId);
      }
    }
    if (filters?.minPrice !== undefined && filters?.minPrice !== null) {
      whereParts.push('price_minor >= ?');
      otherParams.push(filters.minPrice);
    }
    if (filters?.maxPrice !== undefined && filters?.maxPrice !== null) {
      whereParts.push('price_minor <= ?');
      otherParams.push(filters.maxPrice);
    }

    if (rel.hasSearch) {
      whereParts.push(rel.whereClause);
    }

    const whereClause = `WHERE ${whereParts.join(' AND ')}`;
    const baseOrder = this.resolveOrderBy(filters?.sorting);
    const finalOrder = rel.orderClause(baseOrder);

    const selectProjection = rel.hasSearch ? `*, ${rel.scoreSelect}` : '*';
    let selectSql = `SELECT ${selectProjection} FROM products ${whereClause} ${finalOrder}`;
    const selectParams: unknown[] = rel.hasSearch
      ? [...rel.scoreParams, ...otherParams, ...rel.whereParams]
      : [...otherParams];

    if (filters?.limit) {
      selectSql += ' LIMIT ? OFFSET ?';
      selectParams.push(filters.limit, filters.offset || 0);
    }

    const countSql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countParams = rel.hasSearch ? [...otherParams, ...rel.whereParams] : [...otherParams];

    return { selectSql, countSql, selectParams, countParams };
  }

  public static resolveOrderBy(sorting?: string | null): string {
    switch (sorting) {
      case 'abc':
      case 'name_asc': return 'ORDER BY name COLLATE NOCASE ASC';
      case 'name_desc': return 'ORDER BY name COLLATE NOCASE DESC';
      case 'price_asc': return 'ORDER BY price_minor ASC';
      case 'price_desc': return 'ORDER BY price_minor DESC';
      case 'price_major_asc': return 'ORDER BY price_major ASC';
      case 'price_major_desc': return 'ORDER BY price_major DESC';
      case 'created_at_desc': return 'ORDER BY created_at DESC';
      case 'created_at_asc':
      case 'created_at': return 'ORDER BY created_at ASC';
      case 'updated_at':
      case 'updated_at_desc': return 'ORDER BY updated_at DESC';
      case 'price_updated_at_desc': return 'ORDER BY COALESCE(price_updated_at, updated_at, created_at) DESC';
      case 'price_updated_at_asc': return 'ORDER BY COALESCE(price_updated_at, updated_at, created_at) ASC';
      case 'barcode_asc': return 'ORDER BY barcode ASC';
      case 'barcode_desc': return 'ORDER BY barcode DESC';
      default: return 'ORDER BY created_at ASC';
    }
  }
}

