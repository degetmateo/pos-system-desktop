import { Product } from '../../../domain/models/product.entity';
import { MinorPrice } from '../../../domain/models/minor-price.entity';
import { Money } from '../../../domain/value-objects/money.vo';

export interface ProductRow {
  id: string;
  barcode: string | null;
  name: string;
  description: string | null;
  stock: number;
  provider_id: string | null;
  image_name: string | null;
  price_major: number;
  price_minor: number;
  synchronized: number;
  deleted: number;
  created_at: string;
  updated_at: string;
  price_updated_at?: string | null;
}

export interface MinorPriceRow {
  id: string;
  product_id: string;
  condition: string;
  condition_value: number;
  price_value: number;
  created_at: string;
  updated_at: string;
}

export class SqliteProductMapper {
  public static toEntity(row: ProductRow, minorPrices: MinorPrice[]): Product {
    return new Product({
      id: row.id,
      name: row.name,
      barcode: row.barcode,
      description: row.description,
      stock: row.stock,
      providerId: row.provider_id,
      imageName: row.image_name,
      priceMajor: Money.fromCents(row.price_major),
      priceMinor: Money.fromCents(row.price_minor),
      minorPrices,
      synchronized: row.synchronized === 1,
      deleted: row.deleted === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      priceUpdatedAt: row.price_updated_at ? new Date(row.price_updated_at) : null,
    });
  }

  public static toMinorPriceEntity(row: MinorPriceRow): MinorPrice {
    return new MinorPrice({
      id: row.id,
      productId: row.product_id,
      condition: row.condition,
      conditionValue: row.condition_value,
      priceValue: Money.fromCents(row.price_value),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}

