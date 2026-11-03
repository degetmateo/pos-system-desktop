import React, { useState } from 'react';
import '../styles/whatsapp.css';
import { useWhatsappState } from './whatsapp/useWhatsappState';
import { WhatsappQrPanel } from './whatsapp/WhatsappQrPanel';
import { WhatsappSidebar } from './whatsapp/WhatsappSidebar';
import { WhatsappChatWindow } from './whatsapp/WhatsappChatWindow';
import { WhatsappNewChatModal } from './whatsapp/WhatsappNewChatModal';

export const WhatsappView: React.FC = () => {
  const {
    statusInfo, chats, selectedJid, selectedChat, messages,
    search, setSearch, sortBy, setSortBy, importanceFilter, setImportanceFilter,
    loadingChats, loadingMessages, syncingBackground, sending,
    selectChat, handleConnect, handleLogout, handleUpdateImportance,
    handleSendText, handleSendMedia, handleStartChat,
  } = useWhatsappState();

  const [newChatOpen, setNewChatOpen] = useState(false);

  if (statusInfo.status !== 'connected') {
    return <WhatsappQrPanel statusInfo={statusInfo} onConnect={handleConnect} />;
  }

  return (
    <>
      <div className={`wa-shell ${selectedJid ? 'chat-open' : ''}`}>
        <WhatsappSidebar
          statusInfo={statusInfo}
          chats={chats}
          selectedJid={selectedJid}
          search={search}
          sortBy={sortBy}
          importanceFilter={importanceFilter}
          loading={loadingChats}
          syncing={syncingBackground}
          onSearchChange={setSearch}
          onSortChange={setSortBy}
          onImportanceFilterChange={setImportanceFilter}
          onSelectChat={(jid) => void selectChat(jid)}
          onOpenNewChat={() => setNewChatOpen(true)}
          onLogout={() => void handleLogout()}
        />

        <WhatsappChatWindow
          chat={selectedChat}
          messages={messages}
          loading={loadingMessages}
          sending={sending}
          onBackMobile={() => void selectChat(null)}
          onUpdateImportance={handleUpdateImportance}
          onSendText={handleSendText}
          onSendMedia={handleSendMedia}
        />
      </div>

      <WhatsappNewChatModal
        isOpen={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onStartChat={handleStartChat}
      />
    </>
  );
};
