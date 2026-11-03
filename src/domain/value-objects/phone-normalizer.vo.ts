/**
 * Value Object / Helper de Dominio para normalización y comparación de teléfonos
 * entre contactos de WhatsApp (@s.whatsapp.net) y registros de Clientes en la BD.
 */
export class PhoneNormalizer {
  public static extractDigits(raw: string | null | undefined): string {
    return (raw || '').replace(/\D/g, '');
  }

  /**
   * Extrae los 10 dígitos nacionales si corresponde a numeración argentina,
   * o los dígitos completos para números internacionales, permitiendo cruzar
   * "5491122334455", "+54 11 2233-4455", "011 15 2233 4455" y "1122334455".
   */
  public static toComparableKey(raw: string | null | undefined): string {
    const digits = this.extractDigits(raw);
    if (digits.length < 7) return '';

    if (digits.startsWith('549') && digits.length === 13) {
      return digits.slice(3);
    }
    if (digits.startsWith('54') && digits.length === 12) {
      return digits.slice(2);
    }
    if (digits.startsWith('0') && digits.length >= 11) {
      const withoutZero = digits.slice(1);
      if (withoutZero.length === 12) {
        return this.stripArgentineMobile15(withoutZero);
      }
      if (withoutZero.length === 10) return withoutZero;
    }
    if (digits.length === 12 && !digits.startsWith('54')) {
      const stripped = this.stripArgentineMobile15(digits);
      if (stripped.length === 10) return stripped;
    }
    if (digits.length === 10 && digits.startsWith('15')) {
      return `11${digits.slice(2)}`;
    }
    return digits;
  }

  public static toWhatsappDigits(raw: string | null | undefined): string {
    const trimmed = (raw || '').trim();
    const hasPlus = trimmed.startsWith('+');
    let digits = this.extractDigits(trimmed);

    if (digits.startsWith('54') && digits.length === 12 && !digits.startsWith('549')) {
      digits = `549${digits.slice(2)}`;
    } else if (!hasPlus) {
      const national = this.toComparableKey(trimmed);
      if (national.length === 10 && !digits.startsWith('54')) {
        digits = `549${national}`;
      }
    }
    return digits;
  }

  public static isMeaningfulContactName(name: string | null | undefined): boolean {
    const trimmed = (name || '').trim();
    if (!trimmed || trimmed === 'Contacto de WhatsApp') return false;
    return /\p{L}/u.test(trimmed);
  }

  private static stripArgentineMobile15(twelveDigits: string): string {
    for (const prefixLen of [2, 3, 4]) {
      if (twelveDigits.slice(prefixLen, prefixLen + 2) === '15') {
        return twelveDigits.slice(0, prefixLen) + twelveDigits.slice(prefixLen + 2);
      }
    }
    return twelveDigits;
  }
}

