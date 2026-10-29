import { v7 as uuidv7 } from 'uuid';
import { MinorPrice } from '../../../domain/models/minor-price.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { Barcode } from '../../../domain/value-objects/barcode.vo';
import { CreateProductDto } from '../../dtos/product.dto';
import { IProductRepository } from '../../ports/product-repository.port';
import { BarcodeService } from '../barcode.service';
import { ConflictError } from '../../../domain/errors/conflict.error';

export class ProductFormHelper {
  public static async resolveBarcode(
    rawBarcode: string | null | undefined,
    productRepo: IProductRepository,
    barcodeService: BarcodeService
  ): Promise<Barcode | null> {
    if (rawBarcode === 'INTERNAL_BARCODE') {
      return barcodeService.generateNextBarcode();
    }
    if (!rawBarcode || !rawBarcode.trim()) return null;

    const existing = await productRepo.findByBarcode(rawBarcode.trim());
    if (existing && !existing.deleted) {
      throw new ConflictError('Ya existe un producto con ese código de barras.');
    }
    return Barcode.create(rawBarcode);
  }

  public static extractMinorPrices(productId: string, dto: CreateProductDto): MinorPrice[] {
    const prices: MinorPrice[] = [];
    const entries = [
      { cond: dto.minor_price_condition_1, val: dto.minor_price_value_1 },
      { cond: dto.minor_price_condition_2, val: dto.minor_price_value_2 },
      { cond: dto.minor_price_condition_3, val: dto.minor_price_value_3 },
      { cond: dto.minor_price_condition_4, val: dto.minor_price_value_4 },
    ];
    for (const entry of entries) {
      if (entry.cond && entry.cond > 0 && entry.val && entry.val > 0) {
        prices.push(
          new MinorPrice({
            id: uuidv7(),
            productId,
            condition: 'discount',
            conditionValue: entry.cond,
            priceValue: Money.fromDecimal(entry.val),
          })
        );
      }
    }
    const rawList = (dto as any).minorPrices || (dto as any).minor_prices;
    if (prices.length === 0 && Array.isArray(rawList)) {
      for (const it of rawList) {
        const c = Number(it.conditionValue ?? it.condition_value ?? 0);
        const v = Number(it.priceValue ?? it.price_value ?? 0);
        if (c > 0 && v > 0) {
          prices.push(new MinorPrice({
            id: it.id || uuidv7(), productId, condition: 'discount', conditionValue: c,
            priceValue: Number.isInteger(v) ? Money.fromCents(v) : Money.fromDecimal(v),
          }));
        }
      }
    }
    return prices;
  }
}

