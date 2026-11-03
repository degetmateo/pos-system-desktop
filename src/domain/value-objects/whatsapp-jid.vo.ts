import { InvalidArgumentError } from '../errors/invalid-argument.error';
import { PhoneNormalizer } from './phone-normalizer.vo';

/**
 * Value Object WhatsappJid: Normaliza e interpreta identificadores JID de WhatsApp (@s.whatsapp.net, @lid, @g.us).
 */
export class WhatsappJid {
  private readonly value: string;

  private constructor(rawJid: string) {
    const normalized = WhatsappJid.normalizeRaw(rawJid);
    if (!normalized || !normalized.includes('@')) {
      throw new InvalidArgumentError(`JID de WhatsApp inválido: "${rawJid}"`);
    }
    this.value = normalized;
  }

  private static normalizeRaw(raw: string): string {
    const trimmed = (raw || '').trim();
    if (!trimmed.includes('@')) return '';
    const [userPart, serverPart] = trimmed.split('@');
    const cleanUser = userPart.split(':')[0].trim();
    let cleanServer = serverPart.trim().toLowerCase();
    if (cleanServer === 'c.us' || cleanServer === 'hosted') cleanServer = 's.whatsapp.net';
    if (cleanServer === 'hosted.lid') cleanServer = 'lid';
    if (!cleanUser || !cleanServer) return '';
    return `${cleanUser}@${cleanServer}`;
  }

  public static isStatusOrBroadcastRaw(raw?: string | null): boolean {
    if (!raw) return false;
    const lower = raw.trim().toLowerCase();
    return (
      lower === 'status@broadcast' ||
      lower === 'status@s.whatsapp.net' ||
      lower.endsWith('@broadcast') ||
      lower.endsWith('@newsletter')
    );
  }

  public static create(jid: string): WhatsappJid {
    return new WhatsappJid(jid);
  }

  public static tryCreate(jid: string | null | undefined): WhatsappJid | null {
    if (!jid) return null;
    try {
      return new WhatsappJid(jid);
    } catch {
      return null;
    }
  }

  public static fromPhone(phone: string): WhatsappJid {
    const digits = PhoneNormalizer.toWhatsappDigits(phone);
    if (digits.length < 7 || digits.length > 18) {
      throw new InvalidArgumentError('El número de teléfono debe contener entre 7 y 18 dígitos.');
    }
    return new WhatsappJid(`${digits}@s.whatsapp.net`);
  }

  public getValue(): string { return this.value; }
  public getUser(): string { return this.value.split('@')[0]; }
  public isGroup(): boolean { return this.value.endsWith('@g.us'); }
  public isLid(): boolean { return this.value.endsWith('@lid'); }
  public isPhoneJid(): boolean { return this.value.endsWith('@s.whatsapp.net'); }

  public isBroadcastOrNewsletter(): boolean {
    return WhatsappJid.isStatusOrBroadcastRaw(this.value);
  }

  public isChatJid(): boolean {
    return (this.isPhoneJid() || this.isLid() || this.isGroup()) && !this.isBroadcastOrNewsletter();
  }

  public getPhone(): string | null {
    return this.isPhoneJid() ? this.getUser() : null;
  }

  public getDisplayPhone(): string {
    const phone = this.getPhone();
    if (phone) return `+${phone}`;
    if (this.isLid()) return 'Contacto de WhatsApp';
    return this.getUser();
  }

  public equals(other: WhatsappJid | null | undefined): boolean {
    return Boolean(other && this.value === other.value);
  }

  public toJSON(): string { return this.value; }
}
