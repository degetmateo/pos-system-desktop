import { InvalidArgumentError } from '../errors/invalid-argument.error';

export type CustomerImportanceCode = 'important' | 'normal' | 'low' | 'ignore';

export class CustomerImportance {
  private static readonly VALID: CustomerImportanceCode[] = ['important', 'normal', 'low', 'ignore'];

  private static readonly WEIGHTS: Record<CustomerImportanceCode, number> = {
    important: 4,
    normal: 3,
    low: 2,
    ignore: 1,
  };

  private static readonly LABELS: Record<CustomerImportanceCode, string> = {
    important: 'Importante',
    normal: 'Normal',
    low: 'Poca importancia',
    ignore: 'Ignorar',
  };

  private constructor(private readonly code: CustomerImportanceCode) {}

  public static create(value?: string | CustomerImportance | null): CustomerImportance {
    if (value instanceof CustomerImportance) return value;
    const normalized = (value || 'normal').toString().trim().toLowerCase() as CustomerImportanceCode;
    if (!this.VALID.includes(normalized)) {
      throw new InvalidArgumentError(`Nivel de importancia inválido: ${value}`);
    }
    return new CustomerImportance(normalized);
  }

  public static weightOf(code?: string | null): number {
    const normalized = (code || 'normal').toLowerCase() as CustomerImportanceCode;
    return this.WEIGHTS[normalized] ?? 3;
  }

  public getCode(): CustomerImportanceCode {
    return this.code;
  }

  public getWeight(): number {
    return CustomerImportance.WEIGHTS[this.code];
  }

  public getLabel(): string {
    return CustomerImportance.LABELS[this.code];
  }

  public toJSON(): CustomerImportanceCode {
    return this.code;
  }
}

