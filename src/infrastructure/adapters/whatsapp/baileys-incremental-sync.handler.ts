import type { Chat, Contact } from '@whiskeysockets/baileys';
import { IWhatsappChatRepository } from '../../../application/ports/whatsapp-chat-repository.port';
import { IWhatsappIdentityRepository } from '../../../application/ports/whatsapp-identity-repository.port';
import { WhatsappCustomerSyncService } from '../../../application/services/whatsapp-customer-sync.service';
import { WhatsappEventBus } from '../../../application/services/whatsapp-event.bus';
import { WhatsappChat } from '../../../domain/models/whatsapp-chat.entity';
import { WhatsappJid } from '../../../domain/value-objects/whatsapp-jid.vo';
import { BackgroundTaskQueue } from '../../concurrency/background-task.queue';
import { BaileysContactMapper } from './baileys-contact.mapper';
import { BaileysLidReconciler } from './baileys-lid.reconciler';
import { BaileysMessageParser } from './baileys-message.parser';

/**
 * Gestor de sincronización incremental de chats y contactos (GoF Observer + POSAD Active Object).
 * Procesa actualizaciones de contactos y chats en lotes cooperativos sin congelar el POS.
 */
export class BaileysIncrementalSyncHandler {
  constructor(
    private readonly chatRepo: IWhatsappChatRepository,
    private readonly eventBus: WhatsappEventBus,
    private readonly identityRepo: IWhatsappIdentityRepository | null = null,
    private readonly lidReconciler: BaileysLidReconciler | null = null,
    private readonly customerSync: WhatsappCustomerSyncService | null = null
  ) {}

  public async handleChatsUpsert(chats: Chat[]): Promise<void> {
    const isBulk = chats.length > 5;
    await BackgroundTaskQueue.processInChunks(chats, isBulk ? 15 : 5, async (chunk) => {
      const savedChats: WhatsappChat[] = [];
      for (const c of chunk) {
        const label = BaileysContactMapper.pickChatLabel(c);
        const jid = this.resolveChatJid(c.id, c.pnJid || c.newJid, label);
        if (!jid || jid.isBroadcastOrNewsletter()) continue;
        const existing = await this.chatRepo.findByJid(jid.getValue());
        const ts = c.conversationTimestamp ? BaileysMessageParser.normalizeTimestamp(c.conversationTimestamp) : (existing?.lastMessageTimestamp ?? Date.now());
        const chat = new WhatsappChat({
          jid, name: label || this.identityRepo?.getContactName(jid.getValue()) || existing?.name,
          unreadCount: c.unreadCount ?? existing?.unreadCount ?? 0, lastMessageText: existing?.lastMessageText ?? null,
          lastMessageTimestamp: ts, lastMessageFromMe: existing?.lastMessageFromMe ?? false,
          pinned: c.pinned != null ? Boolean(c.pinned) : (existing?.pinned ?? false),
        });
        await this.chatRepo.upsert(chat);
        savedChats.push(chat);
        if (this.customerSync && jid.isPhoneJid()) {
          await this.customerSync.syncContact({ chatJid: jid, contactName: label, preferOverwriteAgendaName: Boolean(c.name) });
        }
      }
      if (isBulk && savedChats.length > 0) {
        const enriched = await this.chatRepo.findEnrichedByJids(savedChats.map((sc) => sc.jid.getValue()));
        this.eventBus.publish({ type: 'chats_batch_updated', payload: enriched });
      } else {
        for (const sc of savedChats) {
          const enriched = await this.chatRepo.findEnrichedByJid(sc.jid.getValue());
          this.eventBus.publish({ type: 'chat_updated', payload: enriched || sc.toJSON() });
        }
      }
    }, isBulk ? 3 : 0);
    if (isBulk) this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: chats.length, messagesCount: 0, done: true } });
  }

  public async handleContactsUpdate(contacts: Array<Partial<Contact>>): Promise<void> {
    const isBulk = contacts.length > 5;
    const updatedJids: string[] = [];
    await BackgroundTaskQueue.processInChunks(contacts, isBulk ? 15 : 5, async (chunk) => {
      for (const c of chunk) {
        const label = BaileysContactMapper.pickContactLabel(c);
        const { lid, pn } = BaileysContactMapper.extractLidAndPn(c);
        if (lid && pn) await this.lidReconciler?.applyMappingAndMerge(lid, pn, label);
        const jid = this.resolveChatJid(pn || c.id, lid, label);
        if (!jid || jid.isBroadcastOrNewsletter()) continue;
        if (label) this.identityRepo?.saveContactName(jid.getValue(), label);
        const existing = await this.chatRepo.findByJid(jid.getValue());
        if (this.customerSync && jid.isPhoneJid() && (label || existing)) {
          await this.customerSync.syncContact({ chatJid: jid, contactName: label, preferOverwriteAgendaName: Boolean(c.name) });
        }
        if (existing && label && existing.name !== label) {
          await this.chatRepo.upsert(new WhatsappChat({ ...existing, name: label, updatedAt: new Date() }));
          updatedJids.push(jid.getValue());
          if (!isBulk) {
            const enriched = await this.chatRepo.findEnrichedByJid(jid.getValue());
            if (enriched) this.eventBus.publish({ type: 'chat_updated', payload: enriched });
          }
        }
      }
      if (isBulk && updatedJids.length > 0) {
        const enriched = await this.chatRepo.findEnrichedByJids(updatedJids.splice(0, updatedJids.length));
        this.eventBus.publish({ type: 'chats_batch_updated', payload: enriched });
      }
    }, isBulk ? 3 : 0);
    if (isBulk) this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: contacts.length, messagesCount: 0, done: true } });
  }

  private resolveChatJid(rawId?: string | null, altId?: string | null, name?: string | null): WhatsappJid | null {
    return this.lidReconciler ? this.lidReconciler.resolveCanonicalJid(rawId, altId, name) : WhatsappJid.tryCreate(altId || rawId);
  }
}

