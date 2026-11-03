import type { WASocket } from '@whiskeysockets/baileys';
import { IWhatsappChatRepository } from '../../../application/ports/whatsapp-chat-repository.port';
import { IWhatsappIdentityRepository } from '../../../application/ports/whatsapp-identity-repository.port';
import { WhatsappCustomerSyncService } from '../../../application/services/whatsapp-customer-sync.service';
import { WhatsappEventBus } from '../../../application/services/whatsapp-event.bus';
import { PhoneNormalizer } from '../../../domain/value-objects/phone-normalizer.vo';
import { WhatsappJid } from '../../../domain/value-objects/whatsapp-jid.vo';
import { BackgroundTaskQueue } from '../../concurrency/background-task.queue';

export class BaileysLidReconciler {
  private activeReconcile: Promise<void> | null = null;

  constructor(
    private readonly identityRepo: IWhatsappIdentityRepository,
    private readonly chatRepo: IWhatsappChatRepository,
    private readonly customerSync: WhatsappCustomerSyncService | null,
    private readonly eventBus: WhatsappEventBus
  ) {}

  public resolveCanonicalJid(rawJid?: string | null, altJid?: string | null, contactName?: string | null): WhatsappJid | null {
    if (WhatsappJid.isStatusOrBroadcastRaw(rawJid) || WhatsappJid.isStatusOrBroadcastRaw(altJid)) {
      return null;
    }
    const primary = WhatsappJid.tryCreate(rawJid);
    const alt = WhatsappJid.tryCreate(altJid);
    if (primary && !primary.isChatJid()) return null;

    if (primary?.isLid() && alt?.isPhoneJid()) {
      void this.applyMappingAndMerge(primary.getValue(), alt.getValue(), contactName);
      return alt;
    }
    if (primary?.isPhoneJid() && alt?.isLid()) {
      void this.applyMappingAndMerge(alt.getValue(), primary.getValue(), contactName);
      return primary;
    }
    if (primary?.isLid()) {
      const mappedPn = this.identityRepo.getPnForLid(primary.getValue());
      if (mappedPn) return WhatsappJid.tryCreate(mappedPn) || primary;
    }
    if (alt?.isPhoneJid()) return alt;
    return primary;
  }

  public async applyMappingAndMerge(lidRaw: string, pnRaw: string, preferredName?: string | null): Promise<void> {
    const lid = WhatsappJid.tryCreate(lidRaw);
    const pn = WhatsappJid.tryCreate(pnRaw);
    if (!lid?.isLid() || !pn?.isPhoneJid()) return;

    const merged = this.identityRepo.mergeLidChatIntoPn(lid.getValue(), pn.getValue(), preferredName);
    if (merged) {
      if (this.customerSync) {
        await this.customerSync.syncContact({
          chatJid: merged.jid,
          contactName: PhoneNormalizer.isMeaningfulContactName(merged.name) ? merged.name : preferredName,
          preferOverwriteAgendaName: Boolean(preferredName),
        });
      }
      const enriched = (await this.chatRepo.findEnrichedByJid(merged.jid.getValue())) || merged.toJSON();
      this.eventBus.publish({ type: 'chat_deleted', payload: { jid: lid.getValue() } });
      this.eventBus.publish({ type: 'chat_updated', payload: enriched });
    }
  }

  public reconcileAll(sock?: WASocket | null): Promise<void> {
    if (this.activeReconcile) return this.activeReconcile;
    this.activeReconcile = this.executeReconcileAll(sock).finally(() => {
      this.activeReconcile = null;
    });
    return this.activeReconcile;
  }

  private async executeReconcileAll(sock?: WASocket | null): Promise<void> {
    const lidJids = this.identityRepo.findUnresolvedLidChatJids();
    const stillUnresolved: string[] = [];

    await BackgroundTaskQueue.processInChunks(lidJids, 30, async (chunk) => {
      for (const lid of chunk) {
        const knownPn = this.identityRepo.getPnForLid(lid);
        if (knownPn) await this.applyMappingAndMerge(lid, knownPn);
        else stillUnresolved.push(lid);
      }
    });

    if (stillUnresolved.length > 0 && sock?.signalRepository?.lidMapping?.getPNsForLIDs) {
      try {
        const mappings = await sock.signalRepository.lidMapping.getPNsForLIDs(stillUnresolved);
        await BackgroundTaskQueue.processInChunks(mappings || [], 30, async (chunk) => {
          for (const item of chunk) {
            if (item?.lid && item?.pn) await this.applyMappingAndMerge(item.lid, item.pn);
          }
        });
      } catch { /* ignore if signal store has no reverse entry */ }
    }

    const remaining = this.identityRepo.findUnresolvedLidChatJids();
    await BackgroundTaskQueue.processInChunks(remaining, 30, async (chunk) => {
      for (const lid of chunk) {
        const lidChat = await this.chatRepo.findByJid(lid);
        const uniquePn = lidChat ? this.identityRepo.findUniquePnChatByExactName(lidChat.name) : null;
        if (uniquePn && lidChat) await this.applyMappingAndMerge(lid, uniquePn, lidChat.name);
      }
    });

    if (this.customerSync) await this.customerSync.reconcileExistingPhoneChats();
    this.eventBus.publish({ type: 'history_sync', payload: { chatsCount: 0, messagesCount: 0 } });
  }
}
