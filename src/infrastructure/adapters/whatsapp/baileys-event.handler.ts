import type { WASocket, WAMessage } from '@whiskeysockets/baileys';
import { IWhatsappChatRepository } from '../../../application/ports/whatsapp-chat-repository.port';
import { IWhatsappIdentityRepository } from '../../../application/ports/whatsapp-identity-repository.port';
import { IWhatsappMessageRepository } from '../../../application/ports/whatsapp-message-repository.port';
import { WhatsappCustomerSyncService } from '../../../application/services/whatsapp-customer-sync.service';
import { WhatsappEventBus } from '../../../application/services/whatsapp-event.bus';
import { WhatsappChat } from '../../../domain/models/whatsapp-chat.entity';
import { WhatsappMessage } from '../../../domain/models/whatsapp-message.entity';
import { BackgroundTaskQueue } from '../../concurrency/background-task.queue';
import { BaileysHistorySyncHandler } from './baileys-history-sync.handler';
import { BaileysLidReconciler } from './baileys-lid.reconciler';
import { BaileysMessageParser } from './baileys-message.parser';
import { BaileysModuleLoader } from './baileys-module.loader';
import { WhatsappMediaStorage } from './whatsapp-media.storage';

export class BaileysEventHandler {
  private readonly historyHandler: BaileysHistorySyncHandler;
  private sock: WASocket | null = null;

  constructor(
    private readonly chatRepo: IWhatsappChatRepository,
    private readonly messageRepo: IWhatsappMessageRepository,
    private readonly mediaStorage: WhatsappMediaStorage,
    private readonly eventBus: WhatsappEventBus,
    private readonly identityRepo: IWhatsappIdentityRepository | null = null,
    private readonly lidReconciler: BaileysLidReconciler | null = null,
    private readonly customerSync: WhatsappCustomerSyncService | null = null,
    private readonly taskQueue: BackgroundTaskQueue = new BackgroundTaskQueue()
  ) {
    this.historyHandler = new BaileysHistorySyncHandler(
      chatRepo, messageRepo, eventBus, identityRepo, lidReconciler, customerSync
    );
  }

  public bind(sock: WASocket): void {
    this.sock = sock;
    sock.ev.on('messaging-history.set', ({ chats, contacts, messages, lidPnMappings }) => {
      this.taskQueue.enqueue('low', async () => {
        await this.historyHandler.handleHistorySync(chats, contacts, messages, lidPnMappings);
        if (this.lidReconciler) await this.lidReconciler.reconcileAll(sock);
      });
    });
    sock.ev.on('lid-mapping.update', ({ lid, pn }) => {
      if (lid && pn) this.taskQueue.enqueue('low', () => this.lidReconciler?.applyMappingAndMerge(lid, pn));
    });
    sock.ev.on('chats.upsert', (chats) => {
      this.taskQueue.enqueue('low', () => this.historyHandler.handleChatsUpsert(chats));
    });
    sock.ev.on('contacts.upsert', (contacts) => {
      this.taskQueue.enqueue('low', () => this.historyHandler.handleContactsUpdate(contacts));
    });
    sock.ev.on('contacts.update', (contacts) => {
      this.taskQueue.enqueue('low', () => this.historyHandler.handleContactsUpdate(contacts));
    });
    sock.ev.on('messages.upsert', ({ messages, type }) => {
      const isNotify = type === 'notify';
      this.taskQueue.enqueue(isNotify ? 'high' : 'low', () => this.handleMessagesUpsert(messages, isNotify));
    });
    sock.ev.on('messages.update', (updates) => {
      this.taskQueue.enqueue('high', async () => {
        const resolver = this.lidReconciler ? this.lidReconciler.resolveCanonicalJid.bind(this.lidReconciler) : undefined;
        for (const u of updates) {
          const jid = BaileysMessageParser.resolveCanonicalJid(u.key, resolver);
          if (!jid || !u.key.id || u.update.status == null) continue;
          const status = BaileysMessageParser.mapStatus(u.update.status, Boolean(u.key.fromMe));
          await this.messageRepo.updateStatus(u.key.id, jid.getValue(), status);
          this.eventBus.publish({ type: 'message_status', payload: { id: u.key.id, chatJid: jid.getValue(), status } });
        }
      });
    });
  }

  public async handleMessagesUpsert(messages: WAMessage[], isRealtimeNotify: boolean): Promise<void> {
    const resolver = this.lidReconciler ? this.lidReconciler.resolveCanonicalJid.bind(this.lidReconciler) : undefined;
    await BackgroundTaskQueue.processInChunks(messages, 25, async (chunk) => {
      for (const raw of chunk) {
        await this.tryWarmupLidFromSignalStore(raw);
        const msg = BaileysMessageParser.parse(raw, resolver);
        if (!msg) continue;
        await this.messageRepo.upsert(msg);

        const knownContactName = this.identityRepo?.getContactName(msg.chatJid.getValue());
        const existing = (await this.chatRepo.findByJid(msg.chatJid.getValue())) ||
          new WhatsappChat({ jid: msg.chatJid, name: knownContactName || (!msg.fromMe ? msg.senderName : null) });
        const updated = existing.recordMessage({
          previewText: msg.previewText(), timestamp: msg.timestamp, fromMe: msg.fromMe,
          senderName: knownContactName || msg.senderName, incrementUnread: isRealtimeNotify,
        });
        await this.chatRepo.upsert(updated);

        if (this.customerSync && msg.chatJid.isPhoneJid()) {
          await this.customerSync.syncContact({
            chatJid: msg.chatJid,
            contactName: knownContactName || (!msg.fromMe ? msg.senderName : updated.name),
            preferOverwriteAgendaName: Boolean(knownContactName),
          });
        }

        const enriched = (await this.chatRepo.findEnrichedByJid(updated.jid.getValue())) || updated.toJSON();
        this.eventBus.publish({ type: 'message_upsert', payload: msg.toJSON() });
        this.eventBus.publish({ type: 'chat_updated', payload: enriched });

        if (isRealtimeNotify && BaileysMessageParser.extractMediaDescriptor(raw)) {
          this.enqueueMediaDownload(raw, msg);
        }
      }
    });
  }

  private async tryWarmupLidFromSignalStore(raw: WAMessage): Promise<void> {
    if (BaileysMessageParser.isStatusOrNonChatMessage(raw)) return;
    const remote = raw.key?.remoteJid;
    if (!remote?.endsWith('@lid') || raw.key?.remoteJidAlt || this.identityRepo?.getPnForLid(remote)) return;
    if (!this.sock?.signalRepository?.lidMapping?.getPNForLID) return;
    try {
      const pn = await this.sock.signalRepository.lidMapping.getPNForLID(remote);
      if (pn) await this.lidReconciler?.applyMappingAndMerge(remote, pn, raw.key?.fromMe ? null : raw.pushName);
    } catch { /* ignore */ }
  }

  private enqueueMediaDownload(raw: WAMessage, msg: WhatsappMessage): void {
    const desc = BaileysMessageParser.extractMediaDescriptor(raw);
    if (!desc) return;
    this.taskQueue.enqueue('low', async () => {
      try {
        const baileys = await BaileysModuleLoader.load();
        const stream = await baileys.downloadContentFromMessage(desc.downloadable, desc.baileysMediaType);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(Buffer.from(chunk));
        const savedName = this.mediaStorage.saveBuffer(Buffer.concat(chunks), desc.mimeType, desc.fileName);
        const updatedMsg = msg.withMedia(savedName, desc.mimeType, desc.fileName);
        await this.messageRepo.upsert(updatedMsg);
        this.eventBus.publish({ type: 'message_upsert', payload: updatedMsg.toJSON() });
      } catch { /* ignore failed media download */ }
    });
  }
}
