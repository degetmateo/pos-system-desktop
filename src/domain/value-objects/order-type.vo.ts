import { InvalidArgumentError } from '../errors/invalid-argument.error';

export type OrderTypeCode = 'minor' | 'major';

export class OrderType {
  private static readonly VALID_TYPES: OrderTypeCode[] = ['minor', 'major'];

  private readonly code: OrderTypeCode;

  private constructor(code: OrderTypeCode) {
    this.code = code;
  }

  public static create(value: string | null | undefined): OrderType {
    const normalized = (value || 'minor').toLowerCase().trim() as OrderTypeCode;
    if (!OrderType.VALID_TYPES.includes(normalized)) {
      throw new InvalidArgumentError(`Tipo de orden inválido: ${value}`);
    }
    return new OrderType(normalized);
  }

  public static createOptional(value: string | OrderType | null | undefined): OrderType | null {
    if (value instanceof OrderType) return value;
    const raw = (value ?? '').toString().trim().toLowerCase();
    if (!raw || raw === 'unassigned' || raw === 'none') return null;
    if (!OrderType.VALID_TYPES.includes(raw as OrderTypeCode)) {
      throw new InvalidArgumentError(`Tipo de orden inválido: ${value}`);
    }
    return new OrderType(raw as OrderTypeCode);
  }

  public getCode(): OrderTypeCode {
    return this.code;
  }

  public isMajor(): boolean {
    return this.code === 'major';
  }

  public isMinor(): boolean {
    return this.code === 'minor';
  }

  public toJSON(): OrderTypeCode {
    return this.code;
  }
}
