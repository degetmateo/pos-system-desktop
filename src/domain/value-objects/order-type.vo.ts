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

  public getCode(): OrderTypeCode {
    return this.code;
  }

  public isMajor(): boolean {
    return this.code === 'major';
  }

  public toJSON(): string {
    return this.code;
  }

  public isMinor(): boolean {
    return this.code === 'minor';
  }
}

