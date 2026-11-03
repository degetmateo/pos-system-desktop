import type { DownloadableMessage, MediaType, WAMessage, WAMessageContent } from '@whiskeysockets/baileys';
import {
  WhatsappMessage,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from '../../../domain/models/whatsapp-message.entity';
import { WhatsappJid } from '../../../domain/value-objects/whatsapp-jid.vo';

export interface ExtractedMediaDescriptor {
  downloadable: DownloadableMessage;
  baileysMediaType: MediaType;
  mimeType: string;
  fileName: string | null;
}

export type CanonicalJidResolver = (
  rawJid?: string | null,
  altJid?: string | null,
  contactName?: string | null
) => WhatsappJid | null;

export class BaileysMessageParser {
  public static isStatusOrNonChatKey(key?: {
    remoteJid?: string | null;
    remoteJidAlt?: string | null;
    participant?: string | null;
  } | null): boolean {
    if (!key) return true;
    return (
      WhatsappJid.isStatusOrBroadcastRaw(key.remoteJid) ||
      WhatsappJid.isStatusOrBroadcastRaw(key.remoteJidAlt) ||
      WhatsappJid.isStatusOrBroadcastRaw(key.participant)
    );
  }

  public static isStatusOrNonChatMessage(raw: WAMessage): boolean {
    if (!raw?.key?.id || this.isStatusOrNonChatKey(raw.key)) return true;
    if (raw.broadcast || raw.statusPsa) return true;
    if (raw.messageStubType != null && !raw.message) return true;
    const m = raw.message as Record<string, unknown> | null | undefined;
    if (!m) return true;
    if (m.groupStatusMessage || m.groupStatusMessageV2 || m.statusMentionMessage || m.statusAddYours) {
      return true;
    }
    return false;
  }

  public static resolveCanonicalJid(
    key?: { remoteJid?: string | null; remoteJidAlt?: string | null; participant?: string | null },
    resolver?: CanonicalJidResolver,
    contactName?: string | null
  ): WhatsappJid | null {
    if (this.isStatusOrNonChatKey(key)) return null;
    if (resolver) {
      const resolved = resolver(key?.remoteJid, key?.remoteJidAlt, contactName);
      return resolved?.isChatJid() ? resolved : null;
    }
    const primary = WhatsappJid.tryCreate(key?.remoteJid);
    if (primary && !primary.isChatJid()) return null;
    const alt = WhatsappJid.tryCreate(key?.remoteJidAlt);
    if (alt?.isPhoneJid()) return alt;
    return primary?.isChatJid() ? primary : null;
  }

  public static unwrapContent(content?: WAMessageContent | null): WAMessageContent | null {
    if (!content) return null;
    const anyContent = content as Record<string, unknown>;
    if (anyContent.groupStatusMessage || anyContent.groupStatusMessageV2 || anyContent.statusMentionMessage) return null;
    if (content.ephemeralMessage?.message) return this.unwrapContent(content.ephemeralMessage.message);
    if (content.viewOnceMessage?.message) return this.unwrapContent(content.viewOnceMessage.message);
    if (content.viewOnceMessageV2?.message) return this.unwrapContent(content.viewOnceMessageV2.message);
    if (content.documentWithCaptionMessage?.message) return this.unwrapContent(content.documentWithCaptionMessage.message);
    if (content.editedMessage?.message?.protocolMessage?.editedMessage) {
      return this.unwrapContent(content.editedMessage.message.protocolMessage.editedMessage);
    }
    return content;
  }

  public static parse(raw: WAMessage, resolver?: CanonicalJidResolver): WhatsappMessage | null {
    if (this.isStatusOrNonChatMessage(raw)) return null;
    const pushName = raw.pushName?.trim() || null;
    const chatJid = this.resolveCanonicalJid(raw.key, resolver, raw.key?.fromMe ? null : pushName);
    if (!chatJid || !chatJid.isChatJid() || !raw.key?.id) return null;

    const content = this.unwrapContent(raw.message);
    if (!content || content.protocolMessage || content.reactionMessage || content.senderKeyDistributionMessage) {
      if (!content?.conversation && !content?.extendedTextMessage && !content?.imageMessage && !content?.documentMessage) {
        return null;
      }
    }

    const extracted = this.extractPayload(content!);
    if (!extracted) return null;
    const timestamp = this.normalizeTimestamp(raw.messageTimestamp);
    const senderRaw = chatJid.isGroup()
      ? (raw.key.participantAlt || raw.key.participant || null)
      : (raw.key.fromMe ? null : chatJid.getValue());

    return new WhatsappMessage({
      id: raw.key.id, chatJid, senderJid: senderRaw, senderName: pushName,
      fromMe: Boolean(raw.key.fromMe), body: extracted.body, messageType: extracted.type,
      mimeType: extracted.mimeType, fileName: extracted.fileName,
      status: this.mapStatus(raw.status, Boolean(raw.key.fromMe)), timestamp,
    });
  }

  public static extractMediaDescriptor(raw: WAMessage): ExtractedMediaDescriptor | null {
    if (this.isStatusOrNonChatMessage(raw)) return null;
    const c = this.unwrapContent(raw.message);
    if (!c) return null;
    if (c.imageMessage?.mediaKey) return { downloadable: c.imageMessage, baileysMediaType: 'image', mimeType: c.imageMessage.mimetype || 'image/jpeg', fileName: null };
    if (c.documentMessage?.mediaKey) return { downloadable: c.documentMessage, baileysMediaType: 'document', mimeType: c.documentMessage.mimetype || 'application/octet-stream', fileName: c.documentMessage.fileName || 'documento' };
    if (c.audioMessage?.mediaKey) return { downloadable: c.audioMessage, baileysMediaType: 'audio', mimeType: c.audioMessage.mimetype || 'audio/ogg', fileName: null };
    return null;
  }

  private static extractPayload(c: WAMessageContent): { body: string; type: WhatsappMessageType; mimeType: string | null; fileName: string | null } | null {
    if (c.conversation) return { body: c.conversation, type: 'text', mimeType: null, fileName: null };
    if (c.extendedTextMessage?.text != null && c.extendedTextMessage.text !== '') return { body: c.extendedTextMessage.text, type: 'text', mimeType: null, fileName: null };
    if (c.imageMessage) return { body: c.imageMessage.caption || '', type: 'image', mimeType: c.imageMessage.mimetype || 'image/jpeg', fileName: null };
    if (c.documentMessage) return { body: c.documentMessage.caption || '', type: 'document', mimeType: c.documentMessage.mimetype || 'application/pdf', fileName: c.documentMessage.fileName || 'documento' };
    if (c.audioMessage) return { body: '', type: 'audio', mimeType: c.audioMessage.mimetype || 'audio/ogg', fileName: null };
    if (c.videoMessage) return { body: c.videoMessage.caption || '', type: 'video', mimeType: c.videoMessage.mimetype || 'video/mp4', fileName: null };
    if (c.stickerMessage) return { body: '', type: 'sticker', mimeType: c.stickerMessage.mimetype || 'image/webp', fileName: null };
    if (c.locationMessage || c.liveLocationMessage) return { body: '📍 Ubicación compartida', type: 'text', mimeType: null, fileName: null };
    if (c.contactMessage || c.contactsArrayMessage) return { body: `👤 Contacto: ${c.contactMessage?.displayName || 'Tarjeta'}`, type: 'text', mimeType: null, fileName: null };
    const btnText = c.buttonsResponseMessage?.selectedDisplayText || c.listResponseMessage?.title || c.templateButtonReplyMessage?.selectedDisplayText;
    if (btnText) return { body: btnText, type: 'text', mimeType: null, fileName: null };
    return null;
  }

  public static normalizeTimestamp(ts: unknown): number {
    if (!ts) return Date.now();
    const num = typeof ts === 'number' ? ts : typeof (ts as { toNumber?: () => number }).toNumber === 'function' ? (ts as { toNumber: () => number }).toNumber() : Number(ts);
    if (!Number.isFinite(num) || num <= 0) return Date.now();
    return num < 1e12 ? num * 1000 : num;
  }

  public static mapStatus(rawStatus: number | null | undefined, fromMe: boolean): WhatsappMessageStatus {
    if (!fromMe) return 'read';
    switch (rawStatus) {
      case 0: return 'error';
      case 1: return 'pending';
      case 2: return 'sent';
      case 3: return 'delivered';
      case 4:
      case 5: return 'read';
      default: return 'sent';
    }
  }
}
