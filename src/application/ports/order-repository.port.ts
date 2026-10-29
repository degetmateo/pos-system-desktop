import { Order } from '../../domain/models/order.entity';

export type OrderSorting =
  | 'created_at_desc'
  | 'created_at_asc'
  | 'number_desc'
  | 'number_asc'
  | 'total_desc'
  | 'total_asc'
  | 'customer_asc'
  | 'customer_desc';

export interface OrderFilters {
  id?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  search?: string | null;
  orderNumber?: number | null;
  type?: string | null;
  status?: string | null;
  paymentMethod?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  minTotal?: number | null;
  maxTotal?: number | null;
  sorting?: OrderSorting | string | null;
  limit?: number;
  offset?: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findAll(filters?: OrderFilters): Promise<Order[]>;
  count(filters?: OrderFilters): Promise<number>;
  save(order: Order): Promise<void>;
  getNextOrderNumber(): Promise<number>;
  getDailyReport(startDate?: string, endDate?: string): Promise<{ labels: string[]; values: number[] }>;
}
