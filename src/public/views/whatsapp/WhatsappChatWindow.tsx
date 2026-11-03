import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Tag } from 'lucide-react';
import { CustomerImportanceCode } from '../../types/api.types';
import { WhatsappChatDto, WhatsappMessageDto } from '../../types/whatsapp.types';
import { WhatsappMessageBubble } from './WhatsappMessageBubble';
import { WhatsappComposer } from './WhatsappComposer';
import { WhatsappFormatHelper } from './whatsapp-format.helper';
import { PriorityBuyerBadge } from '../../components/ImportanceBadge';

interface WhatsappChatWindowProps {
  chat: WhatsappChatDto | null;
  messages: WhatsappMessageDto[];
  loading: boolean;
  sending: boolean;
  onBackMobile: () => void;
  onUpdateImportance: (jid: string, importance: CustomerImportanceCode) => Promise<void>;
  onSendText: (text: string) => Promise<void>;
  onSendMedia: (file: File, caption?: string) => Promise<void>;
}

export const WhatsappChatWindow: React.FC<WhatsappChatWindowProps> = ({
  chat, messages, loading, sending, onBackMobile, onUpdateImportance, onSendText, onSendMedia,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const renderedJidRef = useRef<string | null>(null);
  const lastTailKeyRef = useRef<string>('');
  const stickToBottomRef = useRef<boolean>(true);

  const scrollToBottom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const handleViewportScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 140;
  }, []);

  const handleMediaLoad = useCallback(() => {
    if (stickToBottomRef.current) scrollToBottom();
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    if (!chat || loading) {
      if (!chat) { renderedJidRef.current = null; lastTailKeyRef.current = ''; }
      stickToBottomRef.current = true;
      return;
    }
    const tail = messages[messages.length - 1];
    const tailKey = tail ? `${messages.length}:${tail.id}` : '0';
    const isNewChatRender = renderedJidRef.current !== chat.jid;
    const hasTailChanged = lastTailKeyRef.current !== tailKey;

    if (isNewChatRender || (hasTailChanged && (tail?.fromMe || stickToBottomRef.current))) {
      scrollToBottom();
      const raf = requestAnimationFrame(scrollToBottom);
      renderedJidRef.current = chat.jid;
      lastTailKeyRef.current = tailKey;
      stickToBottomRef.current = true;
      return () => cancelAnimationFrame(raf);
    }

    renderedJidRef.current = chat.jid;
    lastTailKeyRef.current = tailKey;
  }, [chat?.jid, loading, messages, scrollToBottom]);

  if (!chat) {
    return (
      <section className="wa-chat-empty">
        <MessageCircle size={56} color="#00a884" strokeWidth={1.5} />
        <h3>WhatsApp Integrado con Clientes</h3>
        <p>Seleccioná una conversación para enviar presupuestos, ver prioridad de compra y clasificar la importancia del contacto.</p>
      </section>
    );
  }

  return (
    <section className="wa-chat-window">
      <header className="wa-chat-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button type="button" className="wa-icon-btn wa-mobile-back" onClick={onBackMobile}><ArrowLeft size={20} /></button>
          <div className="wa-avatar">{WhatsappFormatHelper.getInitials(chat.name)}</div>
          <div className="wa-chat-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="wa-chat-header-name">{chat.name}</span>
              <PriorityBuyerBadge isPriority={chat.isPriorityBuyer} ordersCount={chat.totalOrdersCount} totalSpentCents={chat.totalSpentCents} />
            </div>
            <span className="wa-chat-header-sub">
              {chat.phone ? `+${chat.phone}` : 'Grupo / Contacto'}
              {chat.customerName && chat.customerName.toLowerCase() !== chat.name.toLowerCase() ? ` • Cliente BD: ${chat.customerName}` : ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={14} color="#64748b" />
          <select
            className="wa-importance-select"
            value={chat.importance || 'normal'}
            onChange={(e) => void onUpdateImportance(chat.jid, e.target.value as CustomerImportanceCode)}
            title="Nivel de importancia del contacto / cliente"
          >
            <option value="important">Importante</option>
            <option value="normal">Normal</option>
            <option value="low">Poca importancia</option>
            <option value="ignore">Ignorar</option>
          </select>
        </div>
      </header>

      <div className="wa-messages-viewport" ref={viewportRef} onScroll={handleViewportScroll}>
        {loading && messages.length === 0 ? (
          <div className="wa-center-hint">Cargando mensajes...</div>
        ) : messages.length === 0 ? (
          <div className="wa-center-hint">No hay mensajes previos en este chat.</div>
        ) : (
          messages.map((m) => (
            <WhatsappMessageBubble key={m.id} message={m} isGroupChat={chat.isGroup} onMediaLoad={handleMediaLoad} />
          ))
        )}
      </div>

      <WhatsappComposer chatJid={chat.jid} sending={sending} onSendText={onSendText} onSendMedia={onSendMedia} />
    </section>
  );
};
