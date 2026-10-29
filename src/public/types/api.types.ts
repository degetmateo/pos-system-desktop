export interface MinorPriceRule {
  id?: string;
  productId?: string;
  condition?: string;
  conditionValue: number;
  priceValue: number; // in cents
}

export interface ProductDto {
  id: string;
  barcode: string | null;
  name: string;
  description: string;
  stock: number;
  providerId: string | null;
  priceMajor: number; // in cents
  priceMinor: number; // in cents
  minorPrices: MinorPriceRule[];
  createdAt?: string;
  updatedAt?: string;
  priceUpdatedAt?: string;
}

export interface PriceHistoryDto {
  id: string;
  productId: string;
  priceType: 'minor' | 'major';
  oldPrice: number; // in cents
  newPrice: number; // in cents
  difference: number; // in cents
  percentageDiff: number;
  createdAt: string;
}

export interface CustomerDto {
  id: string;
  name: string;
  cuil: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  defaultOrderType: 'minor' | 'major' | null;
}

export interface ProviderDto {
  id: string;
  name: string;
  barcodePrefix?: string | null;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // in cents
  discountPrice?: number; // in cents
}

export interface OrderDto {
  id: string;
  number: number;
  customerId: string | null;
  customer?: CustomerDto | null;
  type: 'minor' | 'major';
  paymentMethod: string | null;
  totalPrice: number; // in cents
  advancement: number; // in cents
  status: string;
  items: OrderItemDto[];
  createdAt: string;
}

export interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  port: number;
  fullUrl: string;
  isDefault: boolean;
}

export interface AppInfo {
  ip: string;
  rawIp: string;
  port: number;
  interfaces: NetworkInterfaceInfo[];
}

export interface BackupDto {
  filename: string;
  size: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

