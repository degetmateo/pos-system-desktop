import { v7 as uuidv7 } from 'uuid';
import { Product } from '../../domain/models/product.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { Barcode } from '../../domain/value-objects/barcode.vo';
import { PriceHistory } from '../../domain/models/price-history.entity';
import { IProductRepository, ProductFilters } from '../ports/product-repository.port';
import { IPriceHistoryRepository } from '../ports/price-history-repository.port';
import { BarcodeService } from './barcode.service';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dto';
import { NotFoundError } from '../../domain/errors/not-found.error';
import { ProductFormHelper } from './helpers/product-form.helper';

export class ProductService {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly barcodeService: BarcodeService,
    private readonly priceHistoryRepo?: IPriceHistoryRepository
  ) {}

  public async getProductById(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product || product.deleted) throw new NotFoundError('Producto no encontrado.');
    return product;
  }

  public async listProducts(filters?: ProductFilters): Promise<Product[]> {
    return this.productRepo.findAll(filters);
  }

  public async countProducts(filters?: ProductFilters): Promise<number> {
    return this.productRepo.count(filters);
  }

  public async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    if (!this.priceHistoryRepo) return [];
    return this.priceHistoryRepo.findByProductId(productId);
  }

  public async createProduct(dto: CreateProductDto): Promise<Product> {
    const productId = uuidv7();
    const barcode = await ProductFormHelper.resolveBarcode(dto.barcode, this.productRepo, this.barcodeService);
    const minorPrices = ProductFormHelper.extractMinorPrices(productId, dto);
    const rawMajor = dto.major_price ?? (dto as any).price_major ?? 0;
    const rawMinor = dto.minor_price ?? (dto as any).price_minor ?? 0;

    const product = new Product({
      id: productId,
      name: dto.name,
      barcode,
      description: dto.description,
      stock: dto.stock,
      providerId: dto.provider_id ?? (dto as any).providerId ?? null,
      priceMajor: Money.fromDecimal(rawMajor),
      priceMinor: Money.fromDecimal(rawMinor),
      minorPrices,
    });

    await this.productRepo.save(product);
    return product;
  }

  public async updateProduct(dto: UpdateProductDto): Promise<Product> {
    const existing = await this.getProductById(dto.id);
    const barcode = dto.barcode ? Barcode.create(dto.barcode) : null;
    const minorPrices = ProductFormHelper.extractMinorPrices(dto.id, dto);
    const rawMajor = dto.major_price ?? (dto as any).price_major ?? existing.priceMajor.toDecimal();
    const rawMinor = dto.minor_price ?? (dto as any).price_minor ?? existing.priceMinor.toDecimal();

    const oldMinor = existing.priceMinor.getCents();
    const oldMajor = existing.priceMajor.getCents();
    existing.priceMajor = Money.fromDecimal(rawMajor);
    existing.priceMinor = Money.fromDecimal(rawMinor);
    const newMinor = existing.priceMinor.getCents();
    const newMajor = existing.priceMajor.getCents();

    await this.recordPriceChanges(existing, oldMinor, newMinor, oldMajor, newMajor);

    existing.name = dto.name.trim().toUpperCase();
    existing.barcode = barcode;
    existing.description = dto.description ?? existing.description;
    existing.stock = dto.stock ?? existing.stock;
    existing.providerId = dto.provider_id ?? (dto as any).providerId ?? existing.providerId;
    existing.minorPrices = minorPrices;
    existing.updatedAt = new Date();
    existing.synchronized = false;

    await this.productRepo.save(existing);
    return existing;
  }

  private async recordPriceChanges(prod: Product, oMin: number, nMin: number, oMaj: number, nMaj: number): Promise<void> {
    if (oMin === nMin && oMaj === nMaj) return;
    prod.priceUpdatedAt = new Date();
    if (!this.priceHistoryRepo) return;

    const entries: PriceHistory[] = [];
    if (oMin !== nMin) entries.push(new PriceHistory({ productId: prod.id, priceType: 'minor', oldPrice: oMin, newPrice: nMin }));
    if (oMaj !== nMaj) entries.push(new PriceHistory({ productId: prod.id, priceType: 'major', oldPrice: oMaj, newPrice: nMaj }));
    await this.priceHistoryRepo.saveMany(entries);
  }

  public async deleteProduct(id: string): Promise<void> {
    const product = await this.getProductById(id);
    product.markAsDeleted();
    await this.productRepo.save(product);
  }
}
