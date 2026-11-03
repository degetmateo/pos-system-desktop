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
    const resolvedOrderType = dto.type !== undefined ? dto.type : dto.defaultOrderType;
    const customer = new Customer({
      id: uuidv7(),
      name: dto.name,
      whatsappName: dto.whatsappName,
      description: dto.description,
      cuil: dto.cuil,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      defaultOrderType: resolvedOrderType ?? null,
      importance: dto.importance || 'normal',
    });
    await this.customerRepo.save(customer);
    return customer;
  }

  public async updateCustomer(dto: UpdateCustomerDto): Promise<Customer> {
    const current = await this.getCustomerById(dto.id);
    const resolvedOrderType =
      dto.type !== undefined
        ? dto.type
        : dto.defaultOrderType !== undefined
          ? dto.defaultOrderType
          : current.defaultOrderType?.getCode() ?? null;

    const updated = new Customer({
      id: dto.id,
      name: dto.name ?? current.name,
      whatsappName: dto.whatsappName !== undefined ? dto.whatsappName : current.whatsappName,
      description: dto.description !== undefined ? dto.description : current.description,
      cuil: dto.cuil !== undefined ? dto.cuil : current.cuil,
      email: dto.email !== undefined ? dto.email : current.email,
      phone: dto.phone !== undefined ? dto.phone : current.phone,
      address: dto.address !== undefined ? dto.address : current.address,
      defaultOrderType: resolvedOrderType,
      importance: dto.importance !== undefined ? dto.importance : current.importance,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    });
    await this.customerRepo.save(updated);
    return updated;
  }

  public async deleteCustomer(id: string): Promise<void> {
    await this.getCustomerById(id);
    await this.customerRepo.delete(id);
  }
}
