import { Customer } from '../../domain/models/customer.entity';

export type CustomerSorting =
  | 'abc'
  | 'name_asc'
  | 'name_desc'
  | 'created_at_desc'
  | 'created_at_asc'
  | 'cuil_asc'
  | 'cuil_desc';

export interface CustomerFilters {
  id?: string | null;
  name?: string | null;
  search?: string | null;
  type?: string | null;
  hasCuil?: boolean | null;
  hasPhone?: boolean | null;
  hasEmail?: boolean | null;
  sorting?: CustomerSorting | string | null;
  limit?: number;
  offset?: number;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findAll(filters?: CustomerFilters): Promise<Customer[]>;
  count(filters?: CustomerFilters): Promise<number>;
  save(customer: Customer): Promise<void>;
  delete(id: string): Promise<void>;
}
