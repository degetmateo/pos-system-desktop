import { useEffect, useSyncExternalStore } from 'react';
import { whatsappBackgroundStore } from '../../services/whatsapp-background.store';

export function useWhatsappState() {
  useEffect(() => {
    whatsappBackgroundStore.startInBackground();
  }, []);

  const snap = useSyncExternalStore(
    whatsappBackgroundStore.subscribe,
    whatsappBackgroundStore.getSnapshot,
    whatsappBackgroundStore.getSnapshot
  );

  return {
    statusInfo: snap.statusInfo,
    chats: snap.chats,
    selectedJid: snap.selectedJid,
    selectedChat: snap.chats.find((c) => c.jid === snap.selectedJid) || null,
    messages: snap.messages,
    search: snap.search,
    setSearch: whatsappBackgroundStore.setSearch,
    sortBy: snap.sortBy,
    setSortBy: whatsappBackgroundStore.setSortBy,
    importanceFilter: snap.importanceFilter,
    setImportanceFilter: whatsappBackgroundStore.setImportanceFilter,
    loadingChats: snap.loadingChats,
    loadingMessages: snap.loadingMessages,
    syncingBackground: snap.syncingBackground,
    sending: snap.sending,
    selectChat: whatsappBackgroundStore.selectChat,
    handleConnect: whatsappBackgroundStore.connect,
    handleLogout: whatsappBackgroundStore.logout,
    handleUpdateImportance: whatsappBackgroundStore.updateImportance,
    handleSendText: whatsappBackgroundStore.sendText,
    handleSendMedia: whatsappBackgroundStore.sendMedia,
    handleStartChat: whatsappBackgroundStore.startChat,
  };
}
