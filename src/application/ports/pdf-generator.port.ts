import { Order } from '../../domain/models/order.entity';

export interface IPdfGeneratorPort {
  generateReceiptPdf(order: Order): Promise<Buffer>;
  generateReceiptHtml(order: Order): string;
}

