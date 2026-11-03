import { Database as DatabaseInstance } from 'better-sqlite3';
import { Customer } from '../../domain/models/customer.entity';
import { PhoneNormalizer } from '../../domain/value-objects/phone-normalizer.vo';
import { ICustomerRepository, CustomerFilters } from '../../application/ports/customer-repository.port';
import { CustomerQueryBuilder } from './search/customer-query.builder';

interface CustomerRow {
  id: string;
  name: string;
  whatsapp_name: string | null;
  description: string | null;
  cuil: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  default_order_type: string | null;
  importance: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteCustomerRepository implements ICustomerRepository {
  private phoneKeyToId: Map<string, string> | null = null;

  constructor(private readonly db: DatabaseInstance) {}

  public async findById(id: string): Promise<Customer | null> {
    const row = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  public async findByPhone(phone: string): Promise<Customer | null> {
    const targetKey = PhoneNormalizer.toComparableKey(phone);
    if (!targetKey) return null;
    const customerId = this.ensurePhoneIndex().get(targetKey);
    if (!customerId) return null;
    return this.findById(customerId);
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
      INSERT INTO customers (
        id, name, whatsapp_name, description, cuil, email, phone, address,
        default_order_type, importance, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, whatsapp_name = excluded.whatsapp_name, description = excluded.description,
        cuil = excluded.cuil, email = excluded.email, phone = excluded.phone, address = excluded.address,
        default_order_type = excluded.default_order_type, importance = excluded.importance, updated_at = excluded.updated_at
    `).run(
      customer.id, customer.name, customer.whatsappName, customer.description, customer.cuil,
      customer.email, customer.phone, customer.address,
      customer.defaultOrderType ? customer.defaultOrderType.getCode() : null,
      customer.importance.getCode(), customer.createdAt.toISOString(), customer.updatedAt.toISOString()
    );
    this.syncPhoneIndexEntry(customer.id, customer.phone);
  }

  public async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    if (this.phoneKeyToId) {
      for (const [k, v] of this.phoneKeyToId.entries()) {
        if (v === id) this.phoneKeyToId.delete(k);
      }
    }
  }

  private ensurePhoneIndex(): Map<string, string> {
    if (!this.phoneKeyToId) {
      this.phoneKeyToId = new Map<string, string>();
      const rows = this.db
        .prepare("SELECT id, phone FROM customers WHERE phone IS NOT NULL AND TRIM(phone) != ''")
        .all() as Array<{ id: string; phone: string }>;
      for (const r of rows) {
        const key = PhoneNormalizer.toComparableKey(r.phone);
        if (key && !this.phoneKeyToId.has(key)) this.phoneKeyToId.set(key, r.id);
      }
    }
    return this.phoneKeyToId;
  }

  private syncPhoneIndexEntry(id: string, phone: string | null): void {
    if (!this.phoneKeyToId) return;
    for (const [k, v] of this.phoneKeyToId.entries()) {
      if (v === id) this.phoneKeyToId.delete(k);
    }
    const key = PhoneNormalizer.toComparableKey(phone);
    if (key) this.phoneKeyToId.set(key, id);
  }

  private mapToEntity(row: CustomerRow): Customer {
    return new Customer({
      id: row.id, name: row.name, whatsappName: row.whatsapp_name, description: row.description,
      cuil: row.cuil, email: row.email, phone: row.phone, address: row.address,
      defaultOrderType: row.default_order_type, importance: row.importance || 'normal',
      createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    });
  }
}
