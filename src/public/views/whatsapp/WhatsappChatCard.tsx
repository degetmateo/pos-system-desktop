import React from 'react';
import { Users, CheckCheck } from 'lucide-react';
import { WhatsappChatDto } from '../../types/whatsapp.types';
import { WhatsappFormatHelper } from './whatsapp-format.helper';
import { ImportanceBadge, PriorityBuyerBadge } from '../../components/ImportanceBadge';

interface WhatsappChatCardProps {
  chat: WhatsappChatDto;
  active: boolean;
  onSelect: (jid: string) => void;
}

export const WhatsappChatCard: React.FC<WhatsappChatCardProps> = ({ chat, active, onSelect }) => {
  const isIgnored = chat.importance === 'ignore';
  const showBadges = chat.isPriorityBuyer || (chat.totalOrdersCount || 0) > 0 || (chat.importance && chat.importance !== 'normal') || chat.defaultOrderType;

  return (
    <button
      type="button"
      className={`wa-chat-item ${active ? 'active' : ''} ${chat.isPriorityBuyer ? 'wa-priority-card' : ''}`}
      style={{ opacity: isIgnored && !active ? 0.62 : 1 }}
      onClick={() => onSelect(chat.jid)}
    >
      <div className="wa-avatar">
        {chat.isGroup ? <Users size={18} /> : WhatsappFormatHelper.getInitials(chat.name)}
      </div>
      <div className="wa-chat-body">
        <div className="wa-chat-top">
          <span className="wa-chat-name">{chat.name}</span>
          <span className={`wa-chat-time ${chat.unreadCount > 0 ? 'unread' : ''}`}>
            {WhatsappFormatHelper.formatChatTimestamp(chat.lastMessageTimestamp)}
          </span>
        </div>

        {showBadges && (
          <div className="wa-chat-badges">
            <PriorityBuyerBadge
              isPriority={chat.isPriorityBuyer}
              ordersCount={chat.totalOrdersCount}
              totalSpentCents={chat.totalSpentCents}
              compact
            />
            <ImportanceBadge importance={chat.importance} hideNormal compact />
            {chat.defaultOrderType && (
              <span className={`wa-order-type-pill ${chat.defaultOrderType}`}>
                {chat.defaultOrderType === 'major' ? 'Mayorista' : 'Minorista'}
              </span>
            )}
          </div>
        )}

        <div className="wa-chat-bottom">
          <span className="wa-chat-preview">
            {chat.lastMessageFromMe && <CheckCheck size={14} className="wa-inline-check" />}
            {chat.lastMessageText || (chat.phone ? `+${chat.phone}` : 'Sin mensajes')}
          </span>
          {chat.unreadCount > 0 && <span className="wa-unread-badge">{chat.unreadCount}</span>}
        </div>
      </div>
    </button>
  );
};

