import { ProductDto } from '../../types/api.types';

export interface CartItem {
  product: ProductDto;
  quantity: number;
  basePrice: number; // in cents
  effectivePrice: number; // in cents after applying quantity discounts
}

export interface PosV2RowItem {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number; // in decimal ($)
  originalPrice: number | null; // in decimal ($)
  isNewProduct: boolean;
  saveToDb: boolean;
  updatePriceInDb: boolean;
}

export interface PosDraftV1 {
  items: CartItem[];
  orderType: 'minor' | 'major';
  customerId: string;
  paymentMethod: string;
  advancement: number;
}

export interface PosDraftV2 {
  rows: PosV2RowItem[];
  orderType: 'minor' | 'major';
  customerId: string;
  paymentMethod: string;
  advancement: number;
}
