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

/**
 * Gestor de sincronización histórica de WhatsApp (POSAD Active Object + GoF Observer).
 * Emite eventos progresivos por lotes para que la interfaz se actualice de forma no bloqueante.
 */
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
    this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: chats.length, messagesCount: messages.length, done: false } });
    const names = await BaileysContactMapper.ingestHistoryMappings(this.identityRepo, chats, contacts, lidPnMappings);
    const resolver = this.lidReconciler ? this.lidReconciler.resolveCanonicalJid.bind(this.lidReconciler) : undefined;
    const latestByChat = new Map<string, WhatsappMessage>();
    let totalParsedMsgs = 0;

    await BackgroundTaskQueue.processInChunks(messages, 50, async (chunk) => {
      const parsedSlice: WhatsappMessage[] = [];
      for (const raw of chunk) {
        const m = BaileysMessageParser.parse(raw, resolver);
        if (!m) continue;
        parsedSlice.push(m);
        const prev = latestByChat.get(m.chatJid.getValue());
        if (!prev || m.timestamp >= prev.timestamp) latestByChat.set(m.chatJid.getValue(), m);
      }
      if (parsedSlice.length > 0) {
        totalParsedMsgs += parsedSlice.length;
        await this.messageRepo.upsertBatch(parsedSlice);
      }
    }, 2);

    const chatMap = new Map<string, WhatsappChat>();
    for (const rc of chats) {
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

    for (const [jidStr, lastMsg] of latestByChat.entries()) {
      if (!chatMap.has(jidStr)) {
        chatMap.set(jidStr, new WhatsappChat({
          jid: lastMsg.chatJid, name: names.get(jidStr) || this.identityRepo?.getContactName(jidStr) || lastMsg.senderName,
          lastMessageText: lastMsg.previewText(), lastMessageTimestamp: lastMsg.timestamp, lastMessageFromMe: lastMsg.fromMe,
        }));
      }
    }

    const domainChats = Array.from(chatMap.values());
    await BackgroundTaskQueue.processInChunks(domainChats, 15, async (chunk) => {
      await this.chatRepo.upsertBatch(chunk);
      const enriched = await this.chatRepo.findEnrichedByJids(chunk.map((c) => c.jid.getValue()));
      if (enriched.length > 0) this.eventBus.publish({ type: 'chats_batch_updated', payload: enriched });
    }, 3);

    if (this.customerSync) {
      await BackgroundTaskQueue.processInChunks(domainChats, 15, async (chunk) => {
        for (const ch of chunk) {
          if (!ch.jid.isPhoneJid()) continue;
          const agenda = names.get(ch.jid.getValue());
          await this.customerSync!.syncContact({ chatJid: ch.jid, contactName: agenda || ch.name, preferOverwriteAgendaName: Boolean(agenda) });
        }
      }, 3);
    }
    this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: domainChats.length, messagesCount: totalParsedMsgs, done: true } });
  }

  private resolveChatJid(rawId?: string | null, altId?: string | null, name?: string | null): WhatsappJid | null {
    return this.lidReconciler ? this.lidReconciler.resolveCanonicalJid(rawId, altId, name) : WhatsappJid.tryCreate(altId || rawId);
  }
}
