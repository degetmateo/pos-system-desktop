import { InvalidArgumentError } from '../errors/invalid-argument.error';

/**
 * Value Object Money: Encapsula montos monetarios en centavos enteros
 * para garantizar precisión aritmética y eliminar errores de coma flotante.
 */
export class Money {
  private readonly cents: number;

  private constructor(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new InvalidArgumentError('El monto en centavos debe ser un número entero.');
    }
    this.cents = cents;
  }

  public static fromCents(cents: number): Money {
    return new Money(Math.round(cents));
  }

  public static fromDecimal(decimal: number): Money {
    return new Money(Math.round(decimal * 100));
  }

  public static zero(): Money {
    return new Money(0);
  }

  public getCents(): number {
    return this.cents;
  }

  public toDecimal(): number {
    return this.cents / 100;
  }

  public add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  public subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  public multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor));
  }

  public isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  public isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  public equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  public toJSON(): number {
    return this.cents;
  }

  public format(locale: string = 'es-AR', currency: string = 'ARS'): string {
    return (this.toDecimal()).toLocaleString(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    });
  }
}

