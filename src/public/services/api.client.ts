import { ProductDto, CustomerDto, ProviderDto, OrderDto, BackupDto, PaginatedResult, AppInfo, PriceHistoryDto } from '../types/api.types';

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Error en la petición.');
    return json.data !== undefined ? json.data : json;
  }

  public static getInfo = () => ApiClient.request<AppInfo>('/api/info');
  public static getNewBarcode = () => ApiClient.request<string>('/api/barcodes/new');

  public static getProducts = (params?: Record<string, string | number>) =>
    ApiClient.request<ProductDto[]>(`/api/products${params ? `?${new URLSearchParams(params as any)}` : ''}`);

  public static getProductsPaginated = (params?: Record<string, string | number>) =>
    ApiClient.request<PaginatedResult<ProductDto>>(`/api/products?${new URLSearchParams({ ...params, page: String(params?.page || 1) } as any)}`);

  public static async getProductByBarcode(barcode: string): Promise<ProductDto | null> {
    return (await ApiClient.getProducts({ barcode }))[0] || null;
  }

  public static createProduct = (data: Partial<ProductDto>) =>
    ApiClient.request<ProductDto>('/api/products', { method: 'POST', body: JSON.stringify(data) });

  public static updateProduct = (id: string, data: Partial<ProductDto>) =>
    ApiClient.request<ProductDto>(`/api/products/update/${id}`, { method: 'POST', body: JSON.stringify(data) });

  public static deleteProduct = (id: string) =>
    ApiClient.request(`/api/products/${id}`, { method: 'DELETE' });

  public static getPriceHistory = (productId: string) =>
    ApiClient.request<PriceHistoryDto[]>(`/api/products/${productId}/price-history`);

  public static getCustomers = (params?: Record<string, string | number>) =>
    ApiClient.request<CustomerDto[]>(`/api/customers${params ? `?${new URLSearchParams(params as any)}` : ''}`);

  public static getCustomersPaginated = (params?: Record<string, string | number>) =>
    ApiClient.request<PaginatedResult<CustomerDto>>(`/api/customers?${new URLSearchParams({ ...params, page: String(params?.page || 1) } as any)}`);

  public static createCustomer = (data: Partial<CustomerDto>) =>
    ApiClient.request<CustomerDto>('/api/customers', { method: 'POST', body: JSON.stringify(data) });

  public static updateCustomer = (id: string, data: Partial<CustomerDto>) =>
    ApiClient.request<CustomerDto>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

  public static deleteCustomer = (id: string) =>
    ApiClient.request(`/api/customers/${id}`, { method: 'DELETE' });

  public static getProviders = () => ApiClient.request<ProviderDto[]>('/api/providers');

  public static createProvider = (name: string) =>
    ApiClient.request<ProviderDto>('/api/providers', { method: 'POST', body: JSON.stringify({ name }) });

  public static getOrders = (params?: Record<string, string | number>) =>
    ApiClient.request<OrderDto[]>(`/api/orders${params ? `?${new URLSearchParams(params as any)}` : ''}`);

  public static getOrdersPaginated = (params?: Record<string, string | number>) =>
    ApiClient.request<PaginatedResult<OrderDto>>(`/api/orders?${new URLSearchParams({ ...params, page: String(params?.page || 1) } as any)}`);

  public static createOrder = (data: unknown) =>
    ApiClient.request<OrderDto>('/api/orders', { method: 'POST', body: JSON.stringify(data) });

  public static getBackups = () => ApiClient.request<BackupDto[]>('/api/options/backups');

  public static createBackup = () =>
    ApiClient.request<{ filepath: string }>('/api/options/backups', { method: 'POST' });

  public static restoreBackup = (filename: string) =>
    ApiClient.request('/api/options/backups/restore', { method: 'POST', body: JSON.stringify({ filename }) });

  public static defragment = () => ApiClient.request('/api/options/defragment');

  public static openFirewallPort = () =>
    ApiClient.request<{ success: boolean; message: string }>('/api/info/firewall', { method: 'POST' });
}
