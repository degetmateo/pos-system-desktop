import { InvalidArgumentError } from '../errors/invalid-argument.error';

export interface ProviderProps {
  id: string;
  name: string;
  barcodePrefix?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Provider {
  public readonly id: string;
  public readonly name: string;
  public readonly barcodePrefix: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: ProviderProps) {
    if (!props.name || !props.name.trim()) {
      throw new InvalidArgumentError('El nombre del proveedor es obligatorio.');
    }
    this.id = props.id;
    this.name = props.name.trim().toUpperCase();
    this.barcodePrefix = props.barcodePrefix || null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }
}

