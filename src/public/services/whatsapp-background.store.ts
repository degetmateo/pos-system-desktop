import { startTransition } from 'react';
import { CustomerImportanceCode } from '../types/api.types';
import { WhatsappChatSortMode, WhatsappImportanceFilter, WhatsappMessageDto, WhatsappRealtimeEvent } from '../types/whatsapp.types';
import { WhatsappFormatHelper } from '../views/whatsapp/whatsapp-format.helper';
import { ToastService } from './toast.service';
import { WhatsappApi } from './whatsapp.api';
import { WhatsappStoreSnapshot, WhatsappStoreState } from './whatsapp-store.state';

type Listener = () => void;

/**
 * Sincronizador asíncrono en segundo plano (GoF Singleton + Observer + Proxy Cache + Event Coalescer).
 * Mantiene la conexión SSE, sincronización de chats y caché de mensajes fuera del ciclo de montaje
 * de las vistas, usando `startTransition` para no bloquear jamás el resto de la aplicación.
 */
export class WhatsappBackgroundStore {
  private state: WhatsappStoreSnapshot = WhatsappStoreState.createInitial();
  private readonly listeners = new Set<Listener>();
  private readonly messagesCache = new Map<string, WhatsappMessageDto[]>();
  private started = false;
  private autoConnectAttempted = false;
  private hasInitialChatsLoaded = false;
  private coalesceRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private notifyScheduled = false;

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): WhatsappStoreSnapshot => this.state;

  public startInBackground(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    setTimeout(() => {
      WhatsappApi.subscribeEvents((ev) => this.handleRealtimeEvent(ev));
      void this.bootstrapSession();
    }, 0);
  }

  private async bootstrapSession(): Promise<void> {
    void this.refreshChats(true);
    try {
      const st = await WhatsappApi.getStatus();
      this.patchState({ statusInfo: st }, true);
      if (st.status === 'disconnected' && !this.autoConnectAttempted) {
        this.autoConnectAttempted = true;
        void WhatsappApi.connect().catch(() => {});
      }
    } catch { /* ignore offline startup */ }
  }

  private handleRealtimeEvent(ev: WhatsappRealtimeEvent): void {
    const { next, shouldRefreshChats, shouldMarkReadJid } = WhatsappStoreState.reduceRealtimeEvent(
      this.state, ev, this.messagesCache
    );
    if (next !== this.state) {
      this.state = next;
      this.scheduleLowPriorityNotify();
    }
    if (shouldMarkReadJid) void WhatsappApi.markRead(shouldMarkReadJid).catch(() => {});
    if (shouldRefreshChats) this.scheduleCoalescedRefresh();
  }

  private scheduleCoalescedRefresh(): void {
    if (this.coalesceRefreshTimer) return;
    this.coalesceRefreshTimer = setTimeout(() => {
      this.coalesceRefreshTimer = null;
      void this.refreshChats(true);
    }, 280);
  }

  public async refreshChats(silent: boolean = false): Promise<void> {
    const showSpinner = !silent && !this.hasInitialChatsLoaded;
    this.patchState(showSpinner ? { loadingChats: true } : { syncingBackground: true }, silent);
    try {
      const chats = await WhatsappApi.getChats({
        search: this.state.search, sortBy: this.state.sortBy, importance: this.state.importanceFilter,
      });
      this.hasInitialChatsLoaded = true;
      this.patchState({
        chats, loadingChats: false, syncingBackground: false,
        totalUnread: WhatsappStoreState.computeTotalUnread(chats),
      }, silent);
    } catch {
      this.patchState({ loadingChats: false, syncingBackground: false }, silent);
    }
  }

  public setSearch = (search: string): void => { this.patchState({ search }, false); this.debounceFilterRefresh(); };
  public setSortBy = (sortBy: WhatsappChatSortMode): void => { this.patchState({ sortBy }, false); this.debounceFilterRefresh(); };
  public setImportanceFilter = (importanceFilter: WhatsappImportanceFilter): void => {
    this.patchState({ importanceFilter }, false);
    this.debounceFilterRefresh();
  };

  private debounceFilterRefresh(): void {
    if (this.filterDebounceTimer) clearTimeout(this.filterDebounceTimer);
    this.filterDebounceTimer = setTimeout(() => void this.refreshChats(true), 160);
  }

  public selectChat = async (jid: string | null): Promise<void> => {
    if (!jid) { this.patchState({ selectedJid: null, messages: [], loadingMessages: false }, false); return; }
    const cached = this.messagesCache.get(jid);
    const chats = this.state.chats.map((c) => (c.jid === jid && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c));
    this.patchState({
      selectedJid: jid, messages: cached || [], loadingMessages: !cached,
      chats, totalUnread: WhatsappStoreState.computeTotalUnread(chats),
    }, false);
    try {
      const fresh = await WhatsappApi.getMessages(jid, 100);
      this.messagesCache.set(jid, fresh);
      if (this.state.selectedJid === jid) this.patchState({ messages: fresh, loadingMessages: false }, false);
      void WhatsappApi.markRead(jid).catch(() => {});
    } catch (e: any) {
      if (this.state.selectedJid === jid) this.patchState({ loadingMessages: false }, false);
      ToastService.error(e.message || 'No se pudieron cargar los mensajes.');
    }
  };

  public connect = async (): Promise<void> => {
    try { this.patchState({ statusInfo: await WhatsappApi.connect() }, false); }
    catch (e: any) { ToastService.error(e.message); }
  };

  public logout = async (): Promise<void> => {
    this.autoConnectAttempted = true;
    try { this.patchState({ statusInfo: await WhatsappApi.logout(false) }, false); ToastService.info('Sesión de WhatsApp desvinculada.'); }
    catch (e: any) { ToastService.error(e.message); }
  };

  public updateImportance = async (jid: string, imp: CustomerImportanceCode): Promise<void> => {
    try {
      const updated = await WhatsappApi.updateImportance(jid, imp);
      this.state = WhatsappStoreState.applyChatImportanceUpdate(this.state, updated, imp);
      this.notifyImmediate();
      ToastService.success('Importancia actualizada.');
    } catch (e: any) { ToastService.error(e.message); }
  };

  public sendText = async (text: string): Promise<void> => {
    const jid = this.state.selectedJid;
    if (!jid || !text.trim()) return;
    this.patchState({ sending: true }, false);
    try {
      const sent = await WhatsappApi.sendText(jid, text);
      const nextMsgs = WhatsappFormatHelper.upsertAndSortMessages(this.state.messages, sent);
      this.messagesCache.set(jid, nextMsgs);
      this.patchState({ messages: nextMsgs, sending: false }, false);
    } catch (e: any) { this.patchState({ sending: false }, false); ToastService.error(e.message || 'No se pudo enviar el mensaje.'); }
  };

  public sendMedia = async (file: File, caption?: string): Promise<void> => {
    const jid = this.state.selectedJid;
    if (!jid) return;
    this.patchState({ sending: true }, false);
    try {
      const sent = await WhatsappApi.sendMediaFile(jid, file, caption);
      const nextMsgs = WhatsappFormatHelper.upsertAndSortMessages(this.state.messages, sent);
      this.messagesCache.set(jid, nextMsgs);
      this.patchState({ messages: nextMsgs, sending: false }, false);
    } catch (e: any) { this.patchState({ sending: false }, false); ToastService.error(e.message || 'No se pudo enviar el archivo.'); }
  };

  public startChat = async (phone: string, name?: string): Promise<void> => {
    const chat = await WhatsappApi.startChat(phone, name);
    const chats = WhatsappFormatHelper.upsertAndSortChats(this.state.chats, chat, this.state.sortBy);
    this.patchState({ chats }, false);
    await this.selectChat(chat.jid);
  };

  private patchState(partial: Partial<WhatsappStoreSnapshot>, background: boolean): void {
    this.state = { ...this.state, ...partial };
    if (background) this.scheduleLowPriorityNotify();
    else this.notifyImmediate();
  }

  private notifyImmediate(): void {
    for (const l of this.listeners) l();
  }

  private scheduleLowPriorityNotify(): void {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      startTransition(() => this.notifyImmediate());
    });
  }
}

export const whatsappBackgroundStore = new WhatsappBackgroundStore();

