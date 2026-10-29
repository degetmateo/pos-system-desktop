import { InvalidArgumentError } from '../errors/invalid-argument.error';

export type PaymentMethodCode = 'cash' | 'transfer' | 'card' | 'current_account';

export class PaymentMethod {
  private static readonly LABELS: Record<PaymentMethodCode, string> = {
    cash: 'EFECTIVO',
    transfer: 'TRANSFERENCIA',
    card: 'TARJETA',
    current_account: 'CUENTA CORRIENTE',
  };

  private readonly code: PaymentMethodCode;

  private constructor(code: PaymentMethodCode) {
    this.code = code;
  }

  public static create(value: string | null | undefined): PaymentMethod | null {
    if (!value) return null;
    const normalized = value.toLowerCase().trim() as PaymentMethodCode;
    if (!(normalized in PaymentMethod.LABELS)) {
      throw new InvalidArgumentError(`Método de pago no válido: ${value}`);
    }
    return new PaymentMethod(normalized);
  }

  public getCode(): PaymentMethodCode {
    return this.code;
  }

  public toJSON(): string {
    return this.code;
  }

  public getLabel(): string {
    return PaymentMethod.LABELS[this.code];
  }
}

