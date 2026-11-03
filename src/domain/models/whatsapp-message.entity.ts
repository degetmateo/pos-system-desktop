import { WhatsappJid } from '../value-objects/whatsapp-jid.vo';
import { InvalidArgumentError } from '../errors/invalid-argument.error';

export type WhatsappMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'other';
export type WhatsappMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'error';

export interface WhatsappMessageProps {
  id: string;
  chatJid: string | WhatsappJid;
  senderJid?: string | null;
  senderName?: string | null;
  fromMe: boolean;
  body?: string;
  messageType?: WhatsappMessageType;
  mediaPath?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  status?: WhatsappMessageStatus;
  timestamp: number;
}

export class WhatsappMessage {
  public readonly id: string;
  public readonly chatJid: WhatsappJid;
  public readonly senderJid: string | null;
  public readonly senderName: string | null;
  public readonly fromMe: boolean;
  public readonly body: string;
  public readonly messageType: WhatsappMessageType;
  public readonly mediaPath: string | null;
  public readonly mimeType: string | null;
  public readonly fileName: string | null;
  public readonly status: WhatsappMessageStatus;
  public readonly timestamp: number;

  constructor(props: WhatsappMessageProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvalidArgumentError('El ID del mensaje de WhatsApp es obligatorio.');
    }
    this.id = props.id.trim();
    this.chatJid = props.chatJid instanceof WhatsappJid ? props.chatJid : WhatsappJid.create(props.chatJid);
    this.senderJid = props.senderJid ?? null;
    this.senderName = props.senderName?.trim() || null;
    this.fromMe = Boolean(props.fromMe);
    this.body = props.body ?? '';
    this.messageType = props.messageType || 'text';
    this.mediaPath = props.mediaPath ?? null;
    this.mimeType = props.mimeType ?? null;
    this.fileName = props.fileName ?? null;
    this.status = props.status || 'sent';
    this.timestamp = Math.max(0, Math.trunc(props.timestamp));
  }

  public withMedia(mediaPath: string, mimeType?: string | null, fileName?: string | null): WhatsappMessage {
    return new WhatsappMessage({
      ...this,
      mediaPath,
      mimeType: mimeType ?? this.mimeType,
      fileName: fileName ?? this.fileName,
    });
  }

  public previewText(): string {
    if (this.body.trim()) return this.body.trim();
    switch (this.messageType) {
      case 'image': return '📷 Imagen';
      case 'document': return `📄 ${this.fileName || 'Documento'}`;
      case 'audio': return '🎵 Audio';
      case 'video': return '🎥 Video';
      case 'sticker': return '🏷️ Sticker';
      default: return 'Mensaje';
    }
  }

  public toJSON() {
    return {
      id: this.id,
      chatJid: this.chatJid.getValue(),
      senderJid: this.senderJid,
      senderName: this.senderName,
      fromMe: this.fromMe,
      body: this.body,
      messageType: this.messageType,
      mediaUrl: this.mediaPath ? `/api/whatsapp/media/${encodeURIComponent(this.mediaPath)}` : null,
      mimeType: this.mimeType,
      fileName: this.fileName,
      status: this.status,
      timestamp: this.timestamp,
    };
  }
}

