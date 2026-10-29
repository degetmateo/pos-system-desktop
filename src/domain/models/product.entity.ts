import { Barcode } from '../value-objects/barcode.vo';
import { Money } from '../value-objects/money.vo';
import { MinorPrice } from './minor-price.entity';
import { InvalidArgumentError } from '../errors/invalid-argument.error';

export interface ProductProps {
  id: string;
  name: string;
  barcode?: Barcode | string | null;
  description?: string | null;
  stock?: number;
  providerId?: string | null;
  imageName?: string | null;
  priceMajor: Money;
  priceMinor: Money;
  minorPrices?: MinorPrice[];
  synchronized?: boolean;
  deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  priceUpdatedAt?: Date | string | null;
}

export class Product {
  public readonly id: string;
  public name: string;
  public barcode: Barcode | null;
  public description: string | null;
  public stock: number;
  public providerId: string | null;
  public imageName: string | null;
  public priceMajor: Money;
  public priceMinor: Money;
  public minorPrices: MinorPrice[];
  public synchronized: boolean;
  public deleted: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public priceUpdatedAt: Date;

  constructor(props: ProductProps) {
    if (!props.name || !props.name.trim()) {
      throw new InvalidArgumentError('El nombre del producto es obligatorio.');
    }
    this.id = props.id;
    this.name = props.name.trim().toUpperCase();
    this.barcode = props.barcode instanceof Barcode ? props.barcode : Barcode.create(props.barcode);
    this.description = props.description || null;
    this.stock = Math.max(0, props.stock || 0);
    this.providerId = props.providerId || null;
    this.imageName = props.imageName || null;
    this.priceMajor = props.priceMajor;
    this.priceMinor = props.priceMinor;
    this.minorPrices = props.minorPrices || [];
    this.synchronized = props.synchronized ?? false;
    this.deleted = props.deleted ?? false;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
    this.priceUpdatedAt = props.priceUpdatedAt
      ? new Date(props.priceUpdatedAt)
      : (props.updatedAt || props.createdAt || new Date());
  }

  public updateStock(delta: number): void {
    this.stock = Math.max(0, this.stock + delta);
    this.updatedAt = new Date();
    this.synchronized = false;
  }

  public markAsDeleted(): void {
    this.deleted = true;
    this.updatedAt = new Date();
    this.synchronized = false;
  }

  public markAsSynchronized(): void {
    this.synchronized = true;
  }

  public toJSON(): object {
    const minorPrices = this.minorPrices.map((m) => (typeof m.toJSON === 'function' ? m.toJSON() : m));
    return {
      id: this.id,
      name: this.name,
      barcode: this.barcode?.getValue() || null,
      description: this.description,
      stock: this.stock,
      providerId: this.providerId,
      provider_id: this.providerId,
      imageName: this.imageName,
      priceMajor: this.priceMajor.getCents(),
      price_major: this.priceMajor.getCents(),
      priceMinor: this.priceMinor.getCents(),
      price_minor: this.priceMinor.getCents(),
      minorPrices,
      minor_prices: minorPrices,
      synchronized: this.synchronized,
      deleted: this.deleted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      priceUpdatedAt: this.priceUpdatedAt,
      price_updated_at: this.priceUpdatedAt,
    };
  }
}

