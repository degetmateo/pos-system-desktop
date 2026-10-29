export interface CreateOrderItemDto {
  product_id: string;
  quantity: number;
}

export interface CreateOrderDto {
  customer_id?: string | null;
  payment_method?: string | null;
  type?: string;
  advancement?: number; // in decimal
  products: CreateOrderItemDto[];
}

