import { describe, it, expect } from 'vitest';
import { PhoneNormalizer } from '../../src/domain/value-objects/phone-normalizer.vo';
import { CustomerImportance } from '../../src/domain/value-objects/customer-importance.vo';
import { WhatsappJid } from '../../src/domain/value-objects/whatsapp-jid.vo';
import { WhatsappChat } from '../../src/domain/models/whatsapp-chat.entity';
import { Customer } from '../../src/domain/models/customer.entity';

describe('WhatsApp CRM Domain Value Objects & Entities', () => {
  it('normalizes Argentine and international phone formats to a common comparable key', () => {
    const k1 = PhoneNormalizer.toComparableKey('5491122334455');
    const k2 = PhoneNormalizer.toComparableKey('+54 9 11 2233-4455');
    const k3 = PhoneNormalizer.toComparableKey('011 15-2233-4455');
    const k4 = PhoneNormalizer.toComparableKey('11 2233 4455');
    const k5 = PhoneNormalizer.toComparableKey('15-2233-4455');

    expect(k1).toBe('1122334455');
    expect(k2).toBe('1122334455');
    expect(k3).toBe('1122334455');
    expect(k4).toBe('1122334455');
    expect(k5).toBe('1122334455');
  });

  it('prevents raw 14-15 digit @lid identifiers from displaying as cryptic numbers', () => {
    const lidJid = WhatsappJid.create('23738351374505:12@hosted.lid');
    expect(lidJid.getValue()).toBe('23738351374505@lid');
    expect(lidJid.isLid()).toBe(true);
    expect(lidJid.isPhoneJid()).toBe(false);
    expect(lidJid.getPhone()).toBeNull();
    expect(lidJid.getDisplayPhone()).toBe('Contacto de WhatsApp');

    const lidChat = new WhatsappChat({ jid: lidJid, name: '23738351374505' });
    expect(lidChat.name).toBe('Contacto de WhatsApp');
  });

  it('supports Customer with unassigned defaultOrderType (null), whatsappName and importance', () => {
    const autoCreated = new Customer({
      id: 'c-wsp-1',
      name: 'Mateo Kiosco',
      whatsappName: 'Mateo Kiosco',
      phone: '+5491122334455',
      defaultOrderType: null,
    });

    expect(autoCreated.defaultOrderType).toBeNull();
    expect(autoCreated.whatsappName).toBe('Mateo Kiosco');
    expect(autoCreated.importance.getCode()).toBe('normal');
    expect(autoCreated.toJSON().defaultOrderType).toBeNull();

    const promoted = autoCreated.withImportance('important');
    expect(promoted.importance.getCode()).toBe('important');
    expect(CustomerImportance.weightOf('important')).toBeGreaterThan(CustomerImportance.weightOf('ignore'));
  });
});

