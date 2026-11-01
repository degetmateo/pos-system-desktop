export interface OrderCaptureItem {
  quantity: number;
  name: string;
  unitPrice: number;
  subtotal: number;
}

export interface OrderCaptureData {
  orderNumber?: number | null;
  items: OrderCaptureItem[];
  total: number;
  advancement?: number;
  paymentMethod?: string;
  customerName?: string;
}

export function formatCaptureMoney(amount: number): string {
  const parts = Math.max(0, amount).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${intPart},${parts[1]}`;
}

export function formatPaymentMethod(method?: string | null): string {
  if (!method) return 'Efectivo';
  const m = method.toLowerCase().trim();
  if (m === 'cash' || m === 'efectivo') return 'Efectivo';
  if (m === 'transfer' || m === 'transferencia') return 'Transferencia';
  if (m === 'card' || m === 'tarjeta') return 'Tarjeta';
  if (m === 'current_account' || m === 'cuenta corriente') return 'Cuenta Corriente';
  return method.charAt(0).toUpperCase() + method.slice(1);
}
