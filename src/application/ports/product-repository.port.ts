import { Product } from '../../domain/models/product.entity';

export type ProductSorting =
  | 'abc'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'price_major_asc'
  | 'price_major_desc'
  | 'stock_asc'
  | 'stock_desc'
  | 'created_at'
  | 'created_at_desc'
  | 'created_at_asc'
  | 'updated_at'
  | 'price_updated_at_desc'
  | 'price_updated_at_asc'
  | 'barcode_asc'
  | 'barcode_desc';

export interface ProductFilters {
  id?: string | null;
  barcode?: string | null;
  name?: string | null;
  search?: string | null;
  providerId?: string | null;
  stockStatus?: 'all' | 'in_stock' | 'out_of_stock' | 'low_stock' | null;
  minPrice?: number | null; // cents
  maxPrice?: number | null; // cents
  sorting?: ProductSorting | string | null;
  limit?: number;
  offset?: number;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<Product | null>;
  findAll(filters?: ProductFilters): Promise<Product[]>;
  count(filters?: ProductFilters): Promise<number>;
  save(product: Product): Promise<void>;
  saveMany(products: Product[]): Promise<void>;
  delete(id: string): Promise<void>;
  getUnsynchronized(limit?: number): Promise<Product[]>;
  markSynchronized(ids: string[]): Promise<void>;
  resetSynchronization(): Promise<void>;
}
