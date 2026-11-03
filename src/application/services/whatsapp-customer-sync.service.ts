import { v7 as uuidv7 } from 'uuid';
import { Customer } from '../../domain/models/customer.entity';
import { PhoneNormalizer } from '../../domain/value-objects/phone-normalizer.vo';
import { WhatsappJid } from '../../domain/value-objects/whatsapp-jid.vo';
import { ICustomerRepository } from '../ports/customer-repository.port';
import { IWhatsappChatRepository } from '../ports/whatsapp-chat-repository.port';

export interface SyncWhatsappContactInput {
  chatJid: WhatsappJid;
  contactName?: string | null;
  preferOverwriteAgendaName?: boolean;
}

/**
 * Servicio de Aplicación CRM-WhatsApp:
 * - Busca al cliente por número normalizado al recibir mensajes o contactos.
 * - Si existe, actualiza su nombre agendado en WhatsApp (`whatsappName`) y lo vincula al chat.
 * - Si no existe, lo crea automáticamente con su nombre de WhatsApp, número y tipo de venta sin asignar (`null`).
 */
export class WhatsappCustomerSyncService {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly chatRepo: IWhatsappChatRepository
  ) {}

  public async syncContact(input: SyncWhatsappContactInput): Promise<Customer | null> {
    if (!input.chatJid.isPhoneJid()) return null;
    const phoneDigits = input.chatJid.getPhone();
    if (!phoneDigits) return null;

    const meaningfulName = PhoneNormalizer.isMeaningfulContactName(input.contactName)
      ? input.contactName!.trim()
      : null;

    const existing = await this.customerRepo.findByPhone(phoneDigits);
    if (existing) {
      let target = existing;
      const shouldSetWspName =
        meaningfulName &&
        (!existing.whatsappName || (input.preferOverwriteAgendaName && existing.whatsappName !== meaningfulName));
      const existingNameIsNumeric = !PhoneNormalizer.isMeaningfulContactName(existing.name);

      if (shouldSetWspName || (meaningfulName && existingNameIsNumeric)) {
        target = existing.withWhatsappContactInfo(meaningfulName, existingNameIsNumeric);
        await this.customerRepo.save(target);
      }
      await this.chatRepo.linkCustomer(input.chatJid.getValue(), target.id, meaningfulName || target.whatsappName || target.name);
      return target;
    }

    const formattedPhone = `+${phoneDigits}`;
    const created = new Customer({
      id: uuidv7(),
      name: meaningfulName || formattedPhone,
      whatsappName: meaningfulName,
      phone: formattedPhone,
      defaultOrderType: null,
      importance: 'normal',
    });
    await this.customerRepo.save(created);
    await this.chatRepo.linkCustomer(input.chatJid.getValue(), created.id, meaningfulName);
    return created;
  }

  public async reconcileExistingPhoneChats(): Promise<void> {
    const chats = await this.chatRepo.findAll(undefined, 500);
    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];
      if (!chat.jid.isPhoneJid() || chat.customerId) continue;
      await this.syncContact({
        chatJid: chat.jid,
        contactName: PhoneNormalizer.isMeaningfulContactName(chat.name) ? chat.name : null,
        preferOverwriteAgendaName: false,
      });
      if (i % 25 === 24) {
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
    }
  }
}

