import { OrderType } from '../value-objects/order-type.vo';
import { InvalidArgumentError } from '../errors/invalid-argument.error';

export interface CustomerProps {
  id: string;
  name: string;
  description?: string | null;
  cuil?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  defaultOrderType?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly cuil: string | null;
  public readonly email: string | null;
  public readonly phone: string | null;
  public readonly address: string | null;
  public readonly defaultOrderType: OrderType;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: CustomerProps) {
    if (!props.name || !props.name.trim()) {
      throw new InvalidArgumentError('El nombre del cliente es obligatorio.');
    }
    this.id = props.id;
    this.name = props.name.trim().toUpperCase();
    this.description = props.description || null;
    this.cuil = props.cuil || null;
    this.email = props.email || null;
    this.phone = props.phone || null;
    this.address = props.address || null;
    this.defaultOrderType = OrderType.create(props.defaultOrderType);
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }
}

