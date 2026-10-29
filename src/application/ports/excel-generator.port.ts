import { Product } from '../../domain/models/product.entity';

export interface ParsedExcelProduct {
  id: string;
  barcode: string | null;
  name: string;
  price_major: number;
  price_minor: number;
  discount_cond_1?: number;
  discount_price_1?: number;
  discount_cond_2?: number;
  discount_price_2?: number;
  discount_cond_3?: number;
  discount_price_3?: number;
  discount_cond_4?: number;
  discount_price_4?: number;
}

export interface IExcelGeneratorPort {
  createInternalBook(products: Product[]): Promise<Buffer>;
  createCustomerBook(products: Product[]): Promise<Buffer>;
  parseInternalBook(buffer: Buffer): Promise<ParsedExcelProduct[]>;
}

