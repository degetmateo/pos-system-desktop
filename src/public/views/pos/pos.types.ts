import { ProductDto } from '../../types/api.types';

export interface CartItem {
  product: ProductDto;
  quantity: number;
  basePrice: number; // in cents
  effectivePrice: number; // in cents after applying quantity discounts
}

