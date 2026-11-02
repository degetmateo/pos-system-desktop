import { Database as DatabaseInstance } from 'better-sqlite3';
import { Customer } from '../../domain/models/customer.entity';
import { ICustomerRepository, CustomerFilters } from '../../application/ports/customer-repository.port';
import { CustomerQueryBuilder } from './search/customer-query.builder';

interface CustomerRow {
  id: string;
  name: string;
  description: string | null;
  cuil: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  default_order_type: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteCustomerRepository implements ICustomerRepository {
  constructor(private readonly db: DatabaseInstance) {}

  public async findById(id: string): Promise<Customer | null> {
    const row = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  public async findAll(filters?: CustomerFilters): Promise<Customer[]> {
    const { selectSql, selectParams } = CustomerQueryBuilder.build(filters);
    const rows = this.db.prepare(selectSql).all(...selectParams) as CustomerRow[];
    return rows.map((r) => this.mapToEntity(r));
  }

  public async count(filters?: CustomerFilters): Promise<number> {
    const { countSql, countParams } = CustomerQueryBuilder.build(filters);
    const row = this.db.prepare(countSql).get(...countParams) as { total: number } | undefined;
    return row?.total || 0;
  }

  public async save(customer: Customer): Promise<void> {
    this.db.prepare(`
      INSERT INTO customers (id, name, description, cuil, email, phone, address, default_order_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, description = excluded.description, cuil = excluded.cuil,
        email = excluded.email, phone = excluded.phone, address = excluded.address,
        default_order_type = excluded.default_order_type, updated_at = excluded.updated_at
    `).run(
      customer.id, customer.name, customer.description, customer.cuil, customer.email,
      customer.phone, customer.address, customer.defaultOrderType.getCode(),
      customer.createdAt.toISOString(), customer.updatedAt.toISOString()
    );
  }

  public async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  }

  private mapToEntity(row: CustomerRow): Customer {
    return new Customer({
      id: row.id,
      name: row.name,
      description: row.description,
      cuil: row.cuil,
      email: row.email,
      phone: row.phone,
      address: row.address,
      defaultOrderType: row.default_order_type,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
