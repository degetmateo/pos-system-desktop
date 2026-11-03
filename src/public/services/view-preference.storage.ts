export interface ProductPreferences {
  search: string;
  providerFilter: string;
  sortKey: string;
}

export interface CustomerPreferences {
  search: string;
  typeFilter: string;
  importanceFilter: string;
  docFilter: string;
  sortKey: string;
}

export interface OrderPreferences {
  search: string;
  typeFilter: string;
  paymentFilter: string;
  datePeriod: string;
  sortKey: string;
}

export class ViewPreferenceStorage {
  private static readonly PRODUCTS_KEY = 'rd_prefs_products';
  private static readonly CUSTOMERS_KEY = 'rd_prefs_customers';
  private static readonly ORDERS_KEY = 'rd_prefs_orders';

  private static safeGet<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return fallback;
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return { ...fallback, ...JSON.parse(raw) };
    } catch {
      return fallback;
    }
  }

  private static safeSet(key: string, value: unknown): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignored if storage is quota exceeded or disabled
    }
  }

  public static getProducts(): ProductPreferences {
    return this.safeGet<ProductPreferences>(this.PRODUCTS_KEY, {
      search: '',
      providerFilter: '',
      sortKey: 'name_asc',
    });
  }

  public static saveProducts(prefs: Partial<ProductPreferences>): void {
    this.safeSet(this.PRODUCTS_KEY, { ...this.getProducts(), ...prefs });
  }

  public static getCustomers(): CustomerPreferences {
    return this.safeGet<CustomerPreferences>(this.CUSTOMERS_KEY, {
      search: '',
      typeFilter: '',
      importanceFilter: '',
      docFilter: '',
      sortKey: 'name_asc',
    });
  }

  public static saveCustomers(prefs: Partial<CustomerPreferences>): void {
    this.safeSet(this.CUSTOMERS_KEY, { ...this.getCustomers(), ...prefs });
  }

  public static getOrders(): OrderPreferences {
    return this.safeGet<OrderPreferences>(this.ORDERS_KEY, {
      search: '',
      typeFilter: '',
      paymentFilter: '',
      datePeriod: '',
      sortKey: 'created_at_desc',
    });
  }

  public static saveOrders(prefs: Partial<OrderPreferences>): void {
    this.safeSet(this.ORDERS_KEY, { ...this.getOrders(), ...prefs });
  }
}
