import crypto from 'node:crypto';
import type { AnyMessageContent } from '@whiskeysockets/baileys';
import { SendWhatsappMediaInput } from '../../../application/dtos/whatsapp.dto';
import { WhatsappMessage, WhatsappMessageType } from '../../../domain/models/whatsapp-message.entity';
import { WhatsappMediaStorage } from './whatsapp-media.storage';

export class BaileysOutboundMapper {
  public static toBaileysMediaPayload(input: SendWhatsappMediaInput, msgType: WhatsappMessageType): AnyMessageContent {
    if (msgType === 'image') return { image: input.buffer, caption: input.caption, mimetype: input.mimeType };
    if (msgType === 'audio') return { audio: input.buffer, mimetype: input.mimeType };
    if (msgType === 'video') return { video: input.buffer, caption: input.caption, mimetype: input.mimeType };
    return { document: input.buffer, mimetype: input.mimeType, fileName: input.fileName, caption: input.caption };
  }

  public static toDomainText(id: string | null | undefined, jid: string, text: string): WhatsappMessage {
    return new WhatsappMessage({
      id: id || crypto.randomUUID(),
      chatJid: jid,
      fromMe: true,
      body: text,
      messageType: 'text',
      status: 'sent',
      timestamp: Date.now(),
    });
  }

  public static toDomainMedia(id: string | null | undefined, input: SendWhatsappMediaInput, savedPath: string): WhatsappMessage {
    return new WhatsappMessage({
      id: id || crypto.randomUUID(),
      chatJid: input.jid,
      fromMe: true,
      body: input.caption || '',
      messageType: WhatsappMediaStorage.classifyMime(input.mimeType),
      mediaPath: savedPath,
      mimeType: input.mimeType,
      fileName: input.fileName,
      status: 'sent',
      timestamp: Date.now(),
    });
  }
}

