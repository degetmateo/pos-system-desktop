import { CustomerImportanceCode } from '../types/api.types';
import {
  WhatsappChatDto,
  WhatsappChatSortMode,
  WhatsappImportanceFilter,
  WhatsappMessageDto,
  WhatsappRealtimeEvent,
  WhatsappStatusDto,
} from '../types/whatsapp.types';

export interface WhatsappGetChatsParams {
  search?: string;
  sortBy?: WhatsappChatSortMode;
  importance?: WhatsappImportanceFilter;
}

export class WhatsappApi {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
    const headers = isFormData
      ? options?.headers
      : { 'Content-Type': 'application/json', ...(options?.headers || {}) };
    const res = await fetch(endpoint, { ...options, headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Error en servicio de WhatsApp.');
    return json.data !== undefined ? json.data : json;
  }

  public static getStatus = () => WhatsappApi.request<WhatsappStatusDto>('/api/whatsapp/status');

  public static connect = () =>
    WhatsappApi.request<WhatsappStatusDto>('/api/whatsapp/connect', { method: 'POST' });

  public static logout = (clearHistory: boolean = false) =>
    WhatsappApi.request<WhatsappStatusDto>('/api/whatsapp/logout', {
      method: 'POST',
      body: JSON.stringify({ clearHistory }),
    });

  public static getChats = (params?: string | WhatsappGetChatsParams) => {
    const qp = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) qp.set('search', params);
    } else if (params) {
      if (params.search) qp.set('search', params.search);
      if (params.sortBy) qp.set('sortBy', params.sortBy);
      if (params.importance && params.importance !== 'all') qp.set('importance', params.importance);
    }
    const qs = qp.toString();
    return WhatsappApi.request<WhatsappChatDto[]>(`/api/whatsapp/chats${qs ? `?${qs}` : ''}`);
  };

  public static startChat = (phone: string, name?: string) =>
    WhatsappApi.request<WhatsappChatDto>('/api/whatsapp/chats/start', {
      method: 'POST',
      body: JSON.stringify({ phone, name }),
    });

  public static updateImportance = (jid: string, importance: CustomerImportanceCode) =>
    WhatsappApi.request<WhatsappChatDto>(
      `/api/whatsapp/chats/${encodeURIComponent(jid)}/importance`,
      { method: 'PATCH', body: JSON.stringify({ importance }) }
    );

  public static getMessages = (jid: string, limit: number = 80) =>
    WhatsappApi.request<WhatsappMessageDto[]>(
      `/api/whatsapp/chats/${encodeURIComponent(jid)}/messages?limit=${limit}`
    );

  public static markRead = (jid: string) =>
    WhatsappApi.request<{ success: boolean }>(
      `/api/whatsapp/chats/${encodeURIComponent(jid)}/read`,
      { method: 'POST' }
    );

  public static sendText = (jid: string, text: string) =>
    WhatsappApi.request<WhatsappMessageDto>(
      `/api/whatsapp/chats/${encodeURIComponent(jid)}/messages`,
      { method: 'POST', body: JSON.stringify({ text }) }
    );

  public static sendMediaFile = (jid: string, file: File, caption?: string) => {
    const form = new FormData();
    form.append('file', file, file.name);
    if (caption) form.append('caption', caption);
    return WhatsappApi.request<WhatsappMessageDto>(
      `/api/whatsapp/chats/${encodeURIComponent(jid)}/media`,
      { method: 'POST', body: form }
    );
  };

  public static subscribeEvents(onEvent: (ev: WhatsappRealtimeEvent) => void): () => void {
    const source = new EventSource('/api/whatsapp/events');
    source.onmessage = (msg) => {
      try { onEvent(JSON.parse(msg.data) as WhatsappRealtimeEvent); }
      catch { /* ignore malformed event */ }
    };
    return () => source.close();
  }
}
