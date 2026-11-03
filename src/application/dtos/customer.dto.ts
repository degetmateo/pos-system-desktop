export interface CreateCustomerDto {
  name: string;
  whatsappName?: string | null;
  description?: string | null;
  cuil?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  type?: string | null; // 'minor' | 'major' | null ('unassigned')
  defaultOrderType?: string | null;
  importance?: string | null; // 'important' | 'normal' | 'low' | 'ignore'
}

export interface UpdateCustomerDto extends CreateCustomerDto {
  id: string;
}
