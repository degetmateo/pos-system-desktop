export interface CreateOrderItemDto {
  product_id?: string | null;
  name?: string | null;
  quantity: number;
  unit_price?: number; // in decimal ($)
  save_to_db?: boolean;
  update_price_in_db?: boolean;
}

export interface CreateOrderDto {
  customer_id?: string | null;
  payment_method?: string | null;
  type?: string;
  advancement?: number; // in decimal
  products: CreateOrderItemDto[];
}
