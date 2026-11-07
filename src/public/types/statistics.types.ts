import { CustomerImportanceCode } from './api.types';

export interface StatisticsKpisDto {
  totalRevenueCents: number;
  totalOrdersCount: number;
  averageTicketCents: number;
  minorOrdersCount: number;
  majorOrdersCount: number;
  minorRevenueCents: number;
  majorRevenueCents: number;
  totalCustomersCount: number;
  priorityCustomersCount: number;
  totalProductsCount: number;
  priceChangesCount: number;
}

export interface SalesSeriesPointDto {
  date: string;
  ordersCount: number;
  revenueCents: number;
  minorRevenueCents: number;
  majorRevenueCents: number;
}

export interface PaymentBreakdownItemDto {
  method: string;
  ordersCount: number;
  revenueCents: number;
}

export interface TopCustomerStatDto {
  id: string;
  name: string;
  whatsappName: string | null;
  phone: string | null;
  importance: CustomerImportanceCode;
  ordersCount: number;
  totalSpentCents: number;
  lastOrderAt: string | null;
}

export interface TopProductStatDto {
  productId: string;
  productName: string;
  unitsSold: number;
  revenueCents: number;
  ordersCount: number;
}

export interface ProductPriceSummaryDto {
  avgMinorCents: number;
  minMinorCents: number;
  maxMinorCents: number;
  avgMajorCents: number;
  minMajorCents: number;
  maxMajorCents: number;
}

export interface RecentPriceChangeDto {
  id: string;
  productId: string;
  productName: string;
  priceType: 'minor' | 'major';
  oldPriceCents: number;
  newPriceCents: number;
  percentageDiff: number;
  createdAt: string;
}

export interface StatisticsOverviewDto {
  period: { startDate: string | null; endDate: string | null; label: string };
  kpis: StatisticsKpisDto;
  salesSeries: SalesSeriesPointDto[];
  paymentBreakdown: PaymentBreakdownItemDto[];
  topCustomers: TopCustomerStatDto[];
  topProducts: TopProductStatDto[];
  productPriceSummary: ProductPriceSummaryDto;
  recentPriceChanges: RecentPriceChangeDto[];
}

