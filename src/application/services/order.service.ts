import { v7 as uuidv7 } from 'uuid';
import { Order } from '../../domain/models/order.entity';
import { OrderItem } from '../../domain/models/order-item.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { OrderType } from '../../domain/value-objects/order-type.vo';
import { IOrderRepository, OrderFilters } from '../ports/order-repository.port';
import { IProductRepository } from '../ports/product-repository.port';
import { ICustomerRepository } from '../ports/customer-repository.port';
import { CreateOrderDto } from '../dtos/order.dto';
import { MajorPricingStrategy } from '../../domain/strategies/major-pricing-strategy';
import { MinorPricingStrategy } from '../../domain/strategies/minor-pricing-strategy';
import { IPricingStrategy } from '../../domain/strategies/pricing-strategy.interface';
import { NotFoundError } from '../../domain/errors/not-found.error';
import { InvalidArgumentError } from '../../domain/errors/invalid-argument.error';

export class OrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly customerRepo: ICustomerRepository
  ) {}

  public async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundError('Orden no encontrada.');
    return order;
  }

  public async listOrders(filters?: OrderFilters): Promise<Order[]> {
    return this.orderRepo.findAll(filters);
  }

  public async countOrders(filters?: OrderFilters): Promise<number> {
    return this.orderRepo.count(filters);
  }

  public async getDailyReport(start?: string, end?: string): Promise<{ labels: string[]; values: number[] }> {
    return this.orderRepo.getDailyReport(start, end);
  }

  public async createOrder(dto: CreateOrderDto): Promise<Order> {
    if (!dto.products || dto.products.length === 0) {
      throw new InvalidArgumentError('La orden debe incluir al menos un producto.');
    }

    const orderId = uuidv7();
    const orderNumber = await this.orderRepo.getNextOrderNumber();
    const orderType = OrderType.create(dto.type);
    const strategy: IPricingStrategy = orderType.isMajor()
      ? new MajorPricingStrategy()
      : new MinorPricingStrategy();

    const rawAdv = typeof dto.advancement === 'number' ? dto.advancement : 0;
    const advancementMoney = Number.isInteger(rawAdv) ? Money.fromCents(rawAdv) : Money.fromDecimal(rawAdv);

    const customer = dto.customer_id ? await this.customerRepo.findById(dto.customer_id) : null;
    const order = new Order({
      id: orderId,
      number: orderNumber,
      customerId: dto.customer_id,
      customer,
      paymentMethod: dto.payment_method,
      type: orderType,
      advancement: advancementMoney,
    });

    for (const itemDto of dto.products) {
      const product = await this.productRepo.findById(itemDto.product_id);
      if (!product) {
        throw new NotFoundError(`Producto no encontrado: ${itemDto.product_id}`);
      }

      const pricing = strategy.calculate(
        product.priceMajor,
        product.priceMinor,
        itemDto.quantity,
        product.minorPrices
      );

      const orderItem = new OrderItem({
        id: uuidv7(),
        orderId,
        productId: product.id,
        productName: product.name,
        quantity: itemDto.quantity,
        price: pricing.unitPrice,
        discountPrice: pricing.discountPrice,
      });

      order.addItem(orderItem);
      product.updateStock(-itemDto.quantity);
      await this.productRepo.save(product);
    }

    await this.orderRepo.save(order);
    return order;
  }
}

