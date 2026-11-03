import { InvalidArgumentError } from '../../domain/errors/invalid-argument.error';
import { NotFoundError } from '../../domain/errors/not-found.error';
import { WhatsappChat } from '../../domain/models/whatsapp-chat.entity';
import { WhatsappMessage } from '../../domain/models/whatsapp-message.entity';
import { CustomerImportance } from '../../domain/value-objects/customer-importance.vo';
import { WhatsappJid } from '../../domain/value-objects/whatsapp-jid.vo';
import { SendWhatsappMediaInput, WhatsappChatDto, WhatsappChatListOptions, WhatsappMessageDto, WhatsappStatusDto } from '../dtos/whatsapp.dto';
import { ICustomerRepository } from '../ports/customer-repository.port';
import { IWhatsappChatRepository } from '../ports/whatsapp-chat-repository.port';
import { IWhatsappClientPort } from '../ports/whatsapp-client.port';
import { IWhatsappMessageRepository } from '../ports/whatsapp-message-repository.port';
import { WhatsappCustomerSyncService } from './whatsapp-customer-sync.service';
import { WhatsappEventBus } from './whatsapp-event.bus';

export class WhatsappService {
  private readonly customerSync: WhatsappCustomerSyncService | null;

  constructor(
    private readonly client: IWhatsappClientPort,
    private readonly chatRepo: IWhatsappChatRepository,
    private readonly messageRepo: IWhatsappMessageRepository,
    private readonly eventBus: WhatsappEventBus,
    private readonly customerRepo: ICustomerRepository | null = null
  ) {
    this.customerSync = customerRepo ? new WhatsappCustomerSyncService(customerRepo, chatRepo) : null;
  }

  public getStatus(): WhatsappStatusDto { return this.client.getStatus(); }

  public async connect(): Promise<WhatsappStatusDto> {
    await this.client.connect();
    return this.client.getStatus();
  }

  public async logout(clearHistory: boolean = false): Promise<WhatsappStatusDto> {
    await this.client.logout();
    if (clearHistory) {
      await this.messageRepo.clearAll();
      await this.chatRepo.clearAll();
      this.eventBus.publish({ type: 'session_cleared', payload: {} });
    }
    return this.client.getStatus();
  }

  public async listChats(searchOrOptions?: string | WhatsappChatListOptions, limit: number = 150): Promise<WhatsappChatDto[]> {
    const opts = typeof searchOrOptions === 'string' || !searchOrOptions ? { search: searchOrOptions, limit } : searchOrOptions;
    return this.chatRepo.findAllEnriched(opts);
  }

  public async startChatByPhone(phone: string, name?: string): Promise<WhatsappChatDto> {
    const jid = WhatsappJid.fromPhone(phone);
    if (!(await this.chatRepo.findByJid(jid.getValue()))) {
      await this.chatRepo.upsert(new WhatsappChat({ jid, name: name?.trim() || jid.getDisplayPhone(), phone: jid.getPhone(), lastMessageTimestamp: Date.now() }));
    }
    await this.customerSync?.syncContact({ chatJid: jid, contactName: name?.trim() || null, preferOverwriteAgendaName: Boolean(name?.trim()) });
    const dto = (await this.chatRepo.findEnrichedByJid(jid.getValue()))!;
    this.eventBus.publish({ type: 'chat_updated', payload: dto });
    return dto;
  }

  public async updateChatImportance(rawJid: string, rawImportance: string): Promise<WhatsappChatDto> {
    const jid = WhatsappJid.create(rawJid);
    const importance = CustomerImportance.create(rawImportance);
    const existing = await this.chatRepo.findByJid(jid.getValue());
    if (!existing) throw new NotFoundError('Conversación de WhatsApp no encontrada.');

    await this.chatRepo.updateImportance(jid.getValue(), importance.getCode());
    if (this.customerRepo) {
      let customer = existing.customerId ? await this.customerRepo.findById(existing.customerId) : null;
      if (!customer && jid.isPhoneJid()) customer = (await this.customerSync?.syncContact({ chatJid: jid, contactName: existing.name })) || null;
      if (customer) await this.customerRepo.save(customer.withImportance(importance.getCode()));
    }
    const dto = (await this.chatRepo.findEnrichedByJid(jid.getValue()))!;
    this.eventBus.publish({ type: 'chat_updated', payload: dto });
    return dto;
  }

  public async getMessages(rawJid: string, limit: number = 80, beforeTs?: number): Promise<WhatsappMessageDto[]> {
    return (await this.messageRepo.findByChatJid(WhatsappJid.create(rawJid).getValue(), limit, beforeTs)).map((m) => m.toJSON());
  }

  public async markChatAsRead(rawJid: string): Promise<void> {
    const jid = WhatsappJid.create(rawJid).getValue();
    const existing = await this.chatRepo.findByJid(jid);
    if (!existing) return;
    await this.chatRepo.markAsRead(jid);
    const unreadKeys = (await this.messageRepo.findByChatJid(jid, 5)).filter((m) => !m.fromMe).map((m) => ({ id: m.id, fromMe: false }));
    await this.client.markChatRead(jid, unreadKeys);
    this.eventBus.publish({ type: 'chat_updated', payload: (await this.chatRepo.findEnrichedByJid(jid)) || existing.markAsRead().toJSON() });
  }

  public async sendText(rawJid: string, text: string): Promise<WhatsappMessageDto> {
    if (!text?.trim()) throw new InvalidArgumentError('El mensaje de texto no puede estar vacío.');
    const message = await this.client.sendTextMessage(WhatsappJid.create(rawJid).getValue(), text.trim());
    await this.persistOutgoing(message);
    return message.toJSON();
  }

  public async sendMedia(input: SendWhatsappMediaInput): Promise<WhatsappMessageDto> {
    if (!input.buffer?.length) throw new InvalidArgumentError('El archivo adjunto está vacío.');
    const message = await this.client.sendMediaMessage({ ...input, jid: WhatsappJid.create(input.jid).getValue() });
    await this.persistOutgoing(message);
    return message.toJSON();
  }

  public resolveMediaPath(filename: string): string {
    const resolved = this.client.resolveMediaFilePath(filename);
    if (!resolved) throw new NotFoundError('Archivo multimedia no encontrado.');
    return resolved;
  }

  private async persistOutgoing(message: WhatsappMessage): Promise<void> {
    await this.messageRepo.upsert(message);
    const current = (await this.chatRepo.findByJid(message.chatJid.getValue())) || new WhatsappChat({ jid: message.chatJid });
    const updated = current.recordMessage({ previewText: message.previewText(), timestamp: message.timestamp, fromMe: true });
    await this.chatRepo.upsert(updated);
    if (message.chatJid.isPhoneJid()) await this.customerSync?.syncContact({ chatJid: message.chatJid, contactName: updated.name });
    const dto = (await this.chatRepo.findEnrichedByJid(updated.jid.getValue())) || updated.toJSON();
    this.eventBus.publish({ type: 'message_upsert', payload: message.toJSON() });
    this.eventBus.publish({ type: 'chat_updated', payload: dto });
  }
}
