import { v7 as uuidv7 } from 'uuid';
import { Customer } from '../../domain/models/customer.entity';
import { ICustomerRepository, CustomerFilters } from '../ports/customer-repository.port';
import { CreateCustomerDto, UpdateCustomerDto } from '../dtos/customer.dto';
import { NotFoundError } from '../../domain/errors/not-found.error';

export class CustomerService {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  public async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundError('Cliente no encontrado.');
    return customer;
  }

  public async listCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    return this.customerRepo.findAll(filters);
  }

  public async countCustomers(filters?: CustomerFilters): Promise<number> {
    return this.customerRepo.count(filters);
  }

  public async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    const customer = new Customer({
      id: uuidv7(),
      name: dto.name,
      cuil: dto.cuil,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      defaultOrderType: dto.type,
    });
    await this.customerRepo.save(customer);
    return customer;
  }

  public async updateCustomer(dto: UpdateCustomerDto): Promise<Customer> {
    await this.getCustomerById(dto.id);
    const updated = new Customer({
      id: dto.id,
      name: dto.name,
      cuil: dto.cuil,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      defaultOrderType: dto.type,
      updatedAt: new Date(),
    });
    await this.customerRepo.save(updated);
    return updated;
  }
}

