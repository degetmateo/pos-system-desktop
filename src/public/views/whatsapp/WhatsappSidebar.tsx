import React from 'react';
import { MessageSquarePlus, LogOut, Search, ArrowUpDown } from 'lucide-react';
import {
  WhatsappChatDto,
  WhatsappChatSortMode,
  WhatsappImportanceFilter,
  WhatsappStatusDto,
} from '../../types/whatsapp.types';
import { WhatsappFormatHelper } from './whatsapp-format.helper';
import { WhatsappChatCard } from './WhatsappChatCard';

interface WhatsappSidebarProps {
  statusInfo: WhatsappStatusDto;
  chats: WhatsappChatDto[];
  selectedJid: string | null;
  search: string;
  sortBy: WhatsappChatSortMode;
  importanceFilter: WhatsappImportanceFilter;
  loading: boolean;
  syncing?: boolean;
  onSearchChange: (val: string) => void;
  onSortChange: (val: WhatsappChatSortMode) => void;
  onImportanceFilterChange: (val: WhatsappImportanceFilter) => void;
  onSelectChat: (jid: string) => void;
  onOpenNewChat: () => void;
  onLogout: () => void;
}

const FILTER_PILLS: Array<{ id: WhatsappImportanceFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'priority', label: '★ Prioritarios' },
  { id: 'important', label: 'Importantes' },
  { id: 'normal', label: 'Normal' },
  { id: 'low', label: 'Poca imp.' },
  { id: 'ignore', label: 'Ignorar' },
];

export const WhatsappSidebar: React.FC<WhatsappSidebarProps> = ({
  statusInfo, chats, selectedJid, search, sortBy, importanceFilter, loading, syncing,
  onSearchChange, onSortChange, onImportanceFilterChange, onSelectChat, onOpenNewChat, onLogout,
}) => {
  const accountLabel = statusInfo.connectedName || (statusInfo.connectedPhone ? `+${statusInfo.connectedPhone}` : 'Conectado');

  return (
    <aside className="wa-sidebar">
      <div className="wa-sidebar-header">
        <div className="wa-account-info">
          <div className="wa-avatar wa-avatar-self">{WhatsappFormatHelper.getInitials(accountLabel)}</div>
          <div className="wa-account-meta">
            <span className="wa-account-name">{accountLabel}</span>
            <span className="wa-account-status">{syncing ? '↻ Sincronizando en 2° plano...' : '● En línea'}</span>
          </div>
        </div>
        <div className="wa-header-actions">
          <button type="button" className="wa-icon-btn" onClick={onOpenNewChat} title="Nuevo chat">
            <MessageSquarePlus size={19} />
          </button>
          <button type="button" className="wa-icon-btn wa-logout-btn" onClick={onLogout} title="Desvincular WhatsApp">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="wa-search-bar">
        <div className="wa-search-row">
          <div className="wa-search-input-wrap" style={{ flex: 1 }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar contacto, número o cliente..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="wa-sort-wrap" title="Ordenar chats">
            <ArrowUpDown size={13} color="#475569" />
            <select value={sortBy} onChange={(e) => onSortChange(e.target.value as WhatsappChatSortMode)}>
              <option value="recent">Recientes</option>
              <option value="importance">Importancia</option>
              <option value="top_buyers">Más compras</option>
            </select>
          </div>
        </div>

        <div className="wa-filter-pills">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`wa-filter-pill ${importanceFilter === pill.id ? 'active' : ''}`}
              onClick={() => onImportanceFilterChange(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wa-chat-list">
        {loading && chats.length === 0 ? (
          <div className="wa-empty-list">Cargando conversaciones...</div>
        ) : chats.length === 0 ? (
          <div className="wa-empty-list">
            No se encontraron conversaciones para este filtro. Usá <strong>+</strong> para iniciar un chat.
          </div>
        ) : (
          chats.map((chat) => (
            <WhatsappChatCard
              key={chat.jid}
              chat={chat}
              active={chat.jid === selectedJid}
              onSelect={onSelectChat}
            />
          ))
        )}
      </div>
    </aside>
  );
};
