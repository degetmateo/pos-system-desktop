import type { Chat, Contact, WAMessage } from '@whiskeysockets/baileys';
import { IWhatsappChatRepository } from '../../../application/ports/whatsapp-chat-repository.port';
import { IWhatsappIdentityRepository } from '../../../application/ports/whatsapp-identity-repository.port';
import { IWhatsappMessageRepository } from '../../../application/ports/whatsapp-message-repository.port';
import { WhatsappCustomerSyncService } from '../../../application/services/whatsapp-customer-sync.service';
import { WhatsappEventBus } from '../../../application/services/whatsapp-event.bus';
import { WhatsappChat } from '../../../domain/models/whatsapp-chat.entity';
import { WhatsappMessage } from '../../../domain/models/whatsapp-message.entity';
import { PhoneNormalizer } from '../../../domain/value-objects/phone-normalizer.vo';
import { WhatsappJid } from '../../../domain/value-objects/whatsapp-jid.vo';
import { BackgroundTaskQueue } from '../../concurrency/background-task.queue';
import { BaileysContactMapper } from './baileys-contact.mapper';
import { BaileysLidReconciler } from './baileys-lid.reconciler';
import { BaileysMessageParser } from './baileys-message.parser';

export class BaileysHistorySyncHandler {
  constructor(
    private readonly chatRepo: IWhatsappChatRepository,
    private readonly messageRepo: IWhatsappMessageRepository,
    private readonly eventBus: WhatsappEventBus,
    private readonly identityRepo: IWhatsappIdentityRepository | null = null,
    private readonly lidReconciler: BaileysLidReconciler | null = null,
    private readonly customerSync: WhatsappCustomerSyncService | null = null
  ) {}

  public async handleHistorySync(
    chats: Chat[],
    contacts: Contact[],
    messages: WAMessage[],
    lidPnMappings?: Array<{ lid: string; pn: string }>
  ): Promise<void> {
    const names = await BaileysContactMapper.ingestHistoryMappings(this.identityRepo, chats, contacts, lidPnMappings);
    const resolver = this.lidReconciler ? this.lidReconciler.resolveCanonicalJid.bind(this.lidReconciler) : undefined;
    const parsedMsgs: WhatsappMessage[] = [];
    const latestByChat = new Map<string, WhatsappMessage>();

    await BackgroundTaskQueue.processInChunks(messages, 120, (chunk) => {
      for (const raw of chunk) {
        const m = BaileysMessageParser.parse(raw, resolver);
        if (!m) continue;
        parsedMsgs.push(m);
        const prev = latestByChat.get(m.chatJid.getValue());
        if (!prev || m.timestamp >= prev.timestamp) latestByChat.set(m.chatJid.getValue(), m);
      }
    });
    await this.messageRepo.upsertBatch(parsedMsgs);

    const chatMap = new Map<string, WhatsappChat>();
    await BackgroundTaskQueue.processInChunks(chats, 80, (chunk) => {
      for (const rc of chunk) {
        const label = BaileysContactMapper.pickChatLabel(rc);
        const jid = this.resolveChatJid(rc.id, rc.pnJid || rc.newJid, label);
        if (!jid || jid.isBroadcastOrNewsletter()) continue;
        const lastMsg = latestByChat.get(jid.getValue());
        const prev = chatMap.get(jid.getValue());
        const resolvedName = [label, names.get(jid.getValue()), this.identityRepo?.getContactName(jid.getValue()), prev?.name, lastMsg?.senderName]
          .find((n) => PhoneNormalizer.isMeaningfulContactName(n)) || null;
        chatMap.set(jid.getValue(), new WhatsappChat({
          jid, name: resolvedName, unreadCount: (prev?.unreadCount || 0) + Math.max(0, rc.unreadCount ?? 0),
          lastMessageText: lastMsg?.previewText() || prev?.lastMessageText || null,
          lastMessageTimestamp: Math.max(prev?.lastMessageTimestamp || 0, BaileysMessageParser.normalizeTimestamp(rc.conversationTimestamp || lastMsg?.timestamp)),
          lastMessageFromMe: lastMsg ? lastMsg.fromMe : (prev?.lastMessageFromMe ?? false),
          pinned: Boolean(rc.pinned || prev?.pinned),
        }));
      }
    });

    for (const [jidStr, lastMsg] of latestByChat.entries()) {
      if (!chatMap.has(jidStr)) {
        chatMap.set(jidStr, new WhatsappChat({
          jid: lastMsg.chatJid, name: names.get(jidStr) || this.identityRepo?.getContactName(jidStr) || lastMsg.senderName,
          lastMessageText: lastMsg.previewText(), lastMessageTimestamp: lastMsg.timestamp, lastMessageFromMe: lastMsg.fromMe,
        }));
      }
    }

    const domainChats = Array.from(chatMap.values());
    await this.chatRepo.upsertBatch(domainChats);
    if (this.customerSync) {
      await BackgroundTaskQueue.processInChunks(domainChats, 35, async (chunk) => {
        for (const ch of chunk) {
          if (!ch.jid.isPhoneJid()) continue;
          const agenda = names.get(ch.jid.getValue());
          await this.customerSync!.syncContact({ chatJid: ch.jid, contactName: agenda || ch.name, preferOverwriteAgendaName: Boolean(agenda) });
        }
      });
    }
    this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: domainChats.length, messagesCount: parsedMsgs.length } });
  }

  public async handleChatsUpsert(chats: Chat[]): Promise<void> {
    const isBulk = chats.length > 5;
    await BackgroundTaskQueue.processInChunks(chats, 40, async (chunk) => {
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
        if (this.customerSync && jid.isPhoneJid()) await this.customerSync.syncContact({ chatJid: jid, contactName: label, preferOverwriteAgendaName: Boolean(c.name) });
        if (!isBulk) this.eventBus.publish({ type: 'chat_updated', payload: (await this.chatRepo.findEnrichedByJid(jid.getValue())) || chat.toJSON() });
      }
    });
    if (isBulk) this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: chats.length, messagesCount: 0 } });
  }

  public async handleContactsUpdate(contacts: Array<Partial<Contact>>): Promise<void> {
    const isBulk = contacts.length > 5;
    let updatedAny = false;
    await BackgroundTaskQueue.processInChunks(contacts, 40, async (chunk) => {
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
          updatedAny = true;
          if (!isBulk) {
            const enriched = await this.chatRepo.findEnrichedByJid(jid.getValue());
            if (enriched) this.eventBus.publish({ type: 'chat_updated', payload: enriched });
          }
        }
      }
    });
    if (isBulk && updatedAny) this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: contacts.length, messagesCount: 0 } });
  }

  private resolveChatJid(rawId?: string | null, altId?: string | null, name?: string | null): WhatsappJid | null {
    return this.lidReconciler ? this.lidReconciler.resolveCanonicalJid(rawId, altId, name) : WhatsappJid.tryCreate(altId || rawId);
  }
}
