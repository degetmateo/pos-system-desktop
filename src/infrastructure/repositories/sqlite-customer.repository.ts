import { Database as DatabaseInstance } from 'better-sqlite3';
import { Customer } from '../../domain/models/customer.entity';
import { ICustomerRepository, CustomerFilters } from '../../application/ports/customer-repository.port';

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

  private buildFilterClauses(filters?: CustomerFilters): { whereClause: string; params: unknown[] } {
    let whereClause = 'WHERE 1 = 1';
    const params: unknown[] = [];

    if (filters?.id) {
      whereClause += ' AND id = ?';
      params.push(filters.id);
    }

    const searchTerm = filters?.search?.trim() || filters?.name?.trim();
    if (searchTerm) {
      const words = searchTerm.split(/\s+/).filter(Boolean);
      for (const w of words) {
        whereClause += ' AND (name LIKE ? COLLATE NOCASE OR cuil LIKE ? OR phone LIKE ? OR email LIKE ? COLLATE NOCASE OR address LIKE ? COLLATE NOCASE)';
        params.push(`%${w}%`, `%${w}%`, `%${w}%`, `%${w}%`, `%${w}%`);
      }
    }

    if (filters?.type) {
      whereClause += ' AND default_order_type = ?';
      params.push(filters.type);
    }

    if (filters?.hasCuil !== undefined && filters?.hasCuil !== null) {
      if (filters.hasCuil) {
        whereClause += ' AND cuil IS NOT NULL AND TRIM(cuil) != ""';
      } else {
        whereClause += ' AND (cuil IS NULL OR TRIM(cuil) = "")';
      }
    }

    if (filters?.hasPhone !== undefined && filters?.hasPhone !== null) {
      if (filters.hasPhone) {
        whereClause += ' AND phone IS NOT NULL AND TRIM(phone) != ""';
      } else {
        whereClause += ' AND (phone IS NULL OR TRIM(phone) = "")';
      }
    }

    if (filters?.hasEmail !== undefined && filters?.hasEmail !== null) {
      if (filters.hasEmail) {
        whereClause += ' AND email IS NOT NULL AND TRIM(email) != ""';
      } else {
        whereClause += ' AND (email IS NULL OR TRIM(email) = "")';
      }
    }

    return { whereClause, params };
  }

  private resolveOrderBy(sorting?: string | null): string {
    switch (sorting) {
      case 'abc':
      case 'name_asc':
        return 'ORDER BY name COLLATE NOCASE ASC';
      case 'name_desc':
        return 'ORDER BY name COLLATE NOCASE DESC';
      case 'created_at_desc':
        return 'ORDER BY created_at DESC';
      case 'created_at_asc':
      case 'created_at':
        return 'ORDER BY created_at ASC';
      case 'cuil_asc':
        return 'ORDER BY cuil ASC';
      case 'cuil_desc':
        return 'ORDER BY cuil DESC';
      default:
        return 'ORDER BY name COLLATE NOCASE ASC';
    }
  }

  public async findAll(filters?: CustomerFilters): Promise<Customer[]> {
    const { whereClause, params } = this.buildFilterClauses(filters);
    let sql = `SELECT * FROM customers ${whereClause} ${this.resolveOrderBy(filters?.sorting)}`;
    if (filters?.limit) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, filters.offset || 0);
    }

    const rows = this.db.prepare(sql).all(...params) as CustomerRow[];
    return rows.map((r) => this.mapToEntity(r));
  }

  public async count(filters?: CustomerFilters): Promise<number> {
    const { whereClause, params } = this.buildFilterClauses(filters);
    const sql = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const row = this.db.prepare(sql).get(...params) as { total: number } | undefined;
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

