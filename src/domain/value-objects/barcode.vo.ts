import { InvalidArgumentError } from '../errors/invalid-argument.error';

/**
 * Value Object Barcode: Normaliza y valida códigos de barras (estándar o internos RD).
 */
export class Barcode {
  private readonly value: string;

  private constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 32) {
      throw new InvalidArgumentError('El código de barras debe tener entre 3 y 32 caracteres.');
    }
    this.value = trimmed;
  }

  public static create(value: string | null | undefined): Barcode | null {
    if (!value || !value.trim()) {
      return null;
    }
    return new Barcode(value);
  }

  public static generateInternal(counter: number, year: number = new Date().getFullYear()): Barcode {
    const yearShort = year.toString().slice(-2);
    const paddedCounter = counter.toString().padStart(9, '0');
    return new Barcode(`RD${yearShort}${paddedCounter}`);
  }

  public getValue(): string {
    return this.value;
  }

  public isInternal(): boolean {
    return /^RD\d{11}$/.test(this.value);
  }

  public toJSON(): string {
    return this.value;
  }

  public equals(other: Barcode | null): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}

