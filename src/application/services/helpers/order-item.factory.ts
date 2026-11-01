import { v7 as uuidv7 } from 'uuid';
import { OrderItem } from '../../../domain/models/order-item.entity';
import { Product } from '../../../domain/models/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { OrderType } from '../../../domain/value-objects/order-type.vo';
import { IPricingStrategy } from '../../../domain/strategies/pricing-strategy.interface';
import { CreateOrderItemDto } from '../../dtos/order.dto';
import { IProductRepository } from '../../ports/product-repository.port';

export class OrderItemFactory {
  public static async resolveItem(
    dto: CreateOrderItemDto,
    orderId: string,
    orderType: OrderType,
    strategy: IPricingStrategy,
    productRepo: IProductRepository
  ): Promise<OrderItem> {
    if (dto.product_id) {
      const product = await productRepo.findById(dto.product_id);
      if (product) {
        return this.resolveExistingProduct(dto, product, orderId, orderType, strategy, productRepo);
      }
    }
    return this.resolveAdHocProduct(dto, orderId, orderType, productRepo);
  }

  private static async resolveExistingProduct(
    dto: CreateOrderItemDto,
    product: Product,
    orderId: string,
    orderType: OrderType,
    strategy: IPricingStrategy,
    productRepo: IProductRepository
  ): Promise<OrderItem> {
    if (dto.unit_price !== undefined && dto.unit_price !== null) {
      const customPrice = Money.fromDecimal(dto.unit_price);
      if (dto.update_price_in_db) {
        if (orderType.isMajor()) product.priceMajor = customPrice;
        else product.priceMinor = customPrice;
        product.priceUpdatedAt = new Date();
        await productRepo.save(product);
      }
      return new OrderItem({
        id: uuidv7(),
        orderId,
        productId: product.id,
        productName: product.name,
        quantity: dto.quantity,
        price: customPrice,
      });
    }

    const pricing = strategy.calculate(product.priceMajor, product.priceMinor, dto.quantity, product.minorPrices);
    return new OrderItem({
      id: uuidv7(),
      orderId,
      productId: product.id,
      productName: product.name,
      quantity: dto.quantity,
      price: pricing.unitPrice,
      discountPrice: pricing.discountPrice,
    });
  }

  private static async resolveAdHocProduct(
    dto: CreateOrderItemDto,
    orderId: string,
    orderType: OrderType,
    productRepo: IProductRepository
  ): Promise<OrderItem> {
    const productName = (dto.name || 'PRODUCTO').trim().toUpperCase();
    const unitPrice = dto.unit_price !== undefined && dto.unit_price !== null ? Money.fromDecimal(dto.unit_price) : Money.zero();

    let productId = uuidv7();
    if (dto.save_to_db) {
      const newProduct = new Product({
        id: productId,
        name: productName,
        priceMajor: unitPrice,
        priceMinor: unitPrice,
      });
      await productRepo.save(newProduct);
      productId = newProduct.id;
    }

    return new OrderItem({
      id: uuidv7(),
      orderId,
      productId,
      productName,
      quantity: dto.quantity,
      price: unitPrice,
    });
  }
}

