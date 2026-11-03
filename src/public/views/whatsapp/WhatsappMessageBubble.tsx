import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { WhatsappMessageDto } from '../../types/whatsapp.types';
import { WhatsappFormatHelper } from './whatsapp-format.helper';

interface WhatsappMessageBubbleProps {
  message: WhatsappMessageDto;
  isGroupChat: boolean;
  onMediaLoad?: () => void;
}

export const WhatsappMessageBubble: React.FC<WhatsappMessageBubbleProps> = ({
  message,
  isGroupChat,
  onMediaLoad,
}) => {
  const renderStatusIcon = () => {
    if (!message.fromMe) return null;
    if (message.status === 'pending') return <Clock size={13} color="#667781" />;
    if (message.status === 'error') return <AlertCircle size={13} color="#ef4444" />;
    if (message.status === 'sent') return <Check size={14} color="#667781" />;
    if (message.status === 'delivered') return <CheckCheck size={14} color="#667781" />;
    return <CheckCheck size={14} color="#53bdeb" />;
  };

  return (
    <div className={`wa-msg-row ${message.fromMe ? 'outgoing' : 'incoming'}`}>
      <div className={`wa-msg-bubble ${message.fromMe ? 'outgoing' : 'incoming'}`}>
        {isGroupChat && !message.fromMe && message.senderName && (
          <div className="wa-msg-sender">{message.senderName}</div>
        )}

        {message.messageType === 'image' && message.mediaUrl && (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="wa-msg-image-link">
            <img
              src={message.mediaUrl}
              alt="Imagen adjunta"
              className="wa-msg-image"
              onLoad={onMediaLoad}
            />
          </a>
        )}

        {message.messageType === 'audio' && message.mediaUrl && (
          <audio controls src={message.mediaUrl} className="wa-msg-audio" />
        )}

        {(message.messageType === 'document' || message.messageType === 'video') && message.mediaUrl && (
          <a href={message.mediaUrl} download={message.fileName || true} target="_blank" rel="noreferrer" className="wa-msg-doc">
            <FileText size={20} color="#00a884" />
            <span className="wa-msg-doc-name">{message.fileName || 'Archivo adjunto'}</span>
            <Download size={16} color="#64748b" />
          </a>
        )}

        {message.body && <div className="wa-msg-text">{message.body}</div>}

        <div className="wa-msg-meta">
          <span>{WhatsappFormatHelper.formatMessageTime(message.timestamp)}</span>
          {renderStatusIcon()}
        </div>
      </div>
    </div>
  );
};
