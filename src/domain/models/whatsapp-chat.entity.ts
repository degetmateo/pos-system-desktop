import { WhatsappJid } from '../value-objects/whatsapp-jid.vo';
import { PhoneNormalizer } from '../value-objects/phone-normalizer.vo';
import { CustomerImportanceCode } from '../value-objects/customer-importance.vo';

export interface WhatsappChatProps {
  jid: string | WhatsappJid;
  name?: string | null;
  phone?: string | null;
  customerId?: string | null;
  lidJid?: string | null;
  importance?: CustomerImportanceCode | null;
  isGroup?: boolean;
  unreadCount?: number;
  lastMessageText?: string | null;
  lastMessageTimestamp?: number;
  lastMessageFromMe?: boolean;
  pinned?: boolean;
  updatedAt?: Date;
}

export class WhatsappChat {
  public readonly jid: WhatsappJid;
  public readonly name: string;
  public readonly phone: string | null;
  public readonly customerId: string | null;
  public readonly lidJid: string | null;
  public readonly importance: CustomerImportanceCode | null;
  public readonly isGroup: boolean;
  public readonly unreadCount: number;
  public readonly lastMessageText: string | null;
  public readonly lastMessageTimestamp: number;
  public readonly lastMessageFromMe: boolean;
  public readonly pinned: boolean;
  public readonly updatedAt: Date;

  constructor(props: WhatsappChatProps) {
    this.jid = props.jid instanceof WhatsappJid ? props.jid : WhatsappJid.create(props.jid);
    this.isGroup = props.isGroup ?? this.jid.isGroup();
    this.phone = props.phone ?? this.jid.getPhone();
    this.customerId = props.customerId || null;
    this.lidJid = props.lidJid || null;
    this.importance = props.importance || null;
    const fallbackName = this.phone ? `+${this.phone}` : this.jid.getDisplayPhone();
    const candidateName = props.name?.trim();
    const isRawLidDigits = Boolean(candidateName && this.jid.isLid() && /^\d{11,}$/.test(candidateName));
    this.name = candidateName && !isRawLidDigits ? candidateName : fallbackName;
    this.unreadCount = Math.max(0, Math.trunc(props.unreadCount ?? 0));
    this.lastMessageText = props.lastMessageText ?? null;
    this.lastMessageTimestamp = Math.max(0, Math.trunc(props.lastMessageTimestamp ?? 0));
    this.lastMessageFromMe = Boolean(props.lastMessageFromMe);
    this.pinned = Boolean(props.pinned);
    this.updatedAt = props.updatedAt || new Date();
  }

  public hasGenericName(): boolean {
    return !PhoneNormalizer.isMeaningfulContactName(this.name);
  }

  public markAsRead(): WhatsappChat {
    return new WhatsappChat({ ...this, unreadCount: 0, updatedAt: new Date() });
  }

  public recordMessage(params: {
    previewText: string;
    timestamp: number;
    fromMe: boolean;
    senderName?: string | null;
    incrementUnread?: boolean;
  }): WhatsappChat {
    const isNewer = params.timestamp >= this.lastMessageTimestamp;
    const resolvedName =
      !this.isGroup && !params.fromMe && this.hasGenericName() && PhoneNormalizer.isMeaningfulContactName(params.senderName)
        ? params.senderName!.trim()
        : this.name;

    return new WhatsappChat({
      ...this,
      name: resolvedName,
      unreadCount: params.incrementUnread && !params.fromMe ? this.unreadCount + 1 : this.unreadCount,
      lastMessageText: isNewer ? params.previewText : this.lastMessageText,
      lastMessageTimestamp: isNewer ? params.timestamp : this.lastMessageTimestamp,
      lastMessageFromMe: isNewer ? params.fromMe : this.lastMessageFromMe,
      updatedAt: new Date(),
    });
  }

  public toJSON() {
    return {
      jid: this.jid.getValue(),
      name: this.name,
      phone: this.phone,
      customerId: this.customerId,
      importance: this.importance || 'normal',
      isGroup: this.isGroup,
      unreadCount: this.unreadCount,
      lastMessageText: this.lastMessageText,
      lastMessageTimestamp: this.lastMessageTimestamp,
      lastMessageFromMe: this.lastMessageFromMe,
      pinned: this.pinned,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
