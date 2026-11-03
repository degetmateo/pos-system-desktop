import { OrderType } from '../value-objects/order-type.vo';
import { CustomerImportance, CustomerImportanceCode } from '../value-objects/customer-importance.vo';
import { InvalidArgumentError } from '../errors/invalid-argument.error';

export interface CustomerProps {
  id: string;
  name: string;
  whatsappName?: string | null;
  description?: string | null;
  cuil?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  defaultOrderType?: string | OrderType | null;
  importance?: string | CustomerImportance | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer {
  public readonly id: string;
  public readonly name: string;
  public readonly whatsappName: string | null;
  public readonly description: string | null;
  public readonly cuil: string | null;
  public readonly email: string | null;
  public readonly phone: string | null;
  public readonly address: string | null;
  public readonly defaultOrderType: OrderType | null;
  public readonly importance: CustomerImportance;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: CustomerProps) {
    if (!props.name || !props.name.trim()) {
      throw new InvalidArgumentError('El nombre del cliente es obligatorio.');
    }
    this.id = props.id;
    this.name = props.name.trim().toUpperCase();
    this.whatsappName = props.whatsappName?.trim() || null;
    this.description = props.description?.trim() || null;
    this.cuil = props.cuil?.trim() || null;
    this.email = props.email?.trim() || null;
    this.phone = props.phone?.trim() || null;
    this.address = props.address?.trim() || null;
    this.defaultOrderType = OrderType.createOptional(props.defaultOrderType);
    this.importance = CustomerImportance.create(props.importance);
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public withWhatsappContactInfo(whatsappName: string | null, replaceNumericName: boolean): Customer {
    const cleanWsp = whatsappName?.trim() || this.whatsappName;
    const nextName = replaceNumericName && cleanWsp ? cleanWsp : this.name;
    return new Customer({
      ...this,
      name: nextName,
      whatsappName: cleanWsp,
      updatedAt: new Date(),
    });
  }

  public withImportance(importance: CustomerImportanceCode | string): Customer {
    return new Customer({ ...this, importance, updatedAt: new Date() });
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      whatsappName: this.whatsappName,
      description: this.description,
      cuil: this.cuil,
      email: this.email,
      phone: this.phone,
      address: this.address,
      defaultOrderType: this.defaultOrderType ? this.defaultOrderType.getCode() : null,
      importance: this.importance.getCode(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
