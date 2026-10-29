export interface CreateProductDto {
  name: string;
  barcode?: string | null;
  description?: string | null;
  stock?: number;
  provider_id?: string | null;
  major_price?: number; // in decimal (e.g. 150.50)
  minor_price?: number;
  minor_price_condition_1?: number;
  minor_price_value_1?: number;
  minor_price_condition_2?: number;
  minor_price_value_2?: number;
  minor_price_condition_3?: number;
  minor_price_value_3?: number;
  minor_price_condition_4?: number;
  minor_price_value_4?: number;
}

export interface UpdateProductDto extends CreateProductDto {
  id: string;
}

