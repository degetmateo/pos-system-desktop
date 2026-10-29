export interface CreateCustomerDto {
  name: string;
  cuil?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  type?: string | null; // 'minor' | 'major'
}

export interface UpdateCustomerDto extends CreateCustomerDto {
  id: string;
}

