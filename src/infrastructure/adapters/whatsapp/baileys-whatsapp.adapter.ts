import fs from 'node:fs';
import path from 'node:path';
import type { WASocket } from '@whiskeysockets/baileys';
import { SendWhatsappMediaInput, WhatsappConnectionStatus, WhatsappStatusDto } from '../../../application/dtos/whatsapp.dto';
import { IWhatsappClientPort } from '../../../application/ports/whatsapp-client.port';
import { WhatsappEventBus } from '../../../application/services/whatsapp-event.bus';
import { ConflictError } from '../../../domain/errors/conflict.error';
import { WhatsappMessage } from '../../../domain/models/whatsapp-message.entity';
import { WhatsappJid } from '../../../domain/value-objects/whatsapp-jid.vo';
import { BackgroundTaskQueue } from '../../concurrency/background-task.queue';
import { BaileysEventHandler } from './baileys-event.handler';
import { BaileysLidReconciler } from './baileys-lid.reconciler';
import { BaileysOutboundMapper } from './baileys-outbound.mapper';
import { BaileysSocketFactory } from './baileys-socket.factory';
import { WhatsappMediaStorage } from './whatsapp-media.storage';

export class BaileysWhatsappAdapter implements IWhatsappClientPort {
  private sock: WASocket | null = null;
  private status: WhatsappConnectionStatus = 'disconnected';
  private qr: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private lastError: string | null = null;
  private manualDisconnect = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly authDir: string,
    private readonly mediaStorage: WhatsappMediaStorage,
    private readonly eventHandler: BaileysEventHandler,
    private readonly eventBus: WhatsappEventBus,
    private readonly lidReconciler: BaileysLidReconciler | null = null,
    private readonly taskQueue: BackgroundTaskQueue = new BackgroundTaskQueue()
  ) {}

  public getStatus(): WhatsappStatusDto {
    return { status: this.status, qr: this.qr, connectedPhone: this.connectedPhone, connectedName: this.connectedName, lastError: this.lastError };
  }

  public async connectIfSessionExists(): Promise<void> {
    if (fs.existsSync(path.join(this.authDir, 'creds.json'))) await this.connect();
  }

  public async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') return;
    this.clearReconnect();
    this.manualDisconnect = false;
    this.lastError = null;
    this.emitStatus('connecting');

    const { sock, baileys } = await BaileysSocketFactory.create(this.authDir);
    this.sock = sock;
    this.eventHandler.bind(sock);

    sock.ev.on('connection.update', (u) => {
      if (u.qr) { this.qr = u.qr; this.emitStatus('qr_ready'); }
      if (u.connection === 'open') {
        this.qr = null;
        this.connectedPhone = WhatsappJid.tryCreate(sock.user?.id)?.getPhone() || null;
        this.connectedName = sock.user?.name || null;
        this.emitStatus('connected');
        if (this.lidReconciler) {
          this.taskQueue.enqueue('low', () => this.lidReconciler!.reconcileAll(sock));
        }
      } else if (u.connection === 'close') {
        const code = (u.lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
        const loggedOut = code === baileys.DisconnectReason.loggedOut;
        this.sock = null;
        this.qr = null;
        if (loggedOut) this.wipeAuthDir();
        this.emitStatus('disconnected');
        if (!loggedOut && !this.manualDisconnect) {
          this.reconnectTimer = setTimeout(() => void this.connect(), 3000);
        }
      }
    });
  }

  public async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    this.clearReconnect();
    this.sock?.end(undefined);
    this.sock = null;
    this.qr = null;
    this.emitStatus('disconnected');
  }

  public async logout(): Promise<void> {
    this.manualDisconnect = true;
    this.clearReconnect();
    try { await this.sock?.logout(); } catch { /* ignore */ }
    this.sock?.end(undefined);
    this.sock = null;
    this.wipeAuthDir();
    this.emitStatus('disconnected');
  }

  public async sendTextMessage(jid: string, text: string): Promise<WhatsappMessage> {
    const sent = await this.requireSocket().sendMessage(jid, { text });
    return BaileysOutboundMapper.toDomainText(sent?.key?.id, jid, text);
  }

  public async sendMediaMessage(input: SendWhatsappMediaInput): Promise<WhatsappMessage> {
    const msgType = WhatsappMediaStorage.classifyMime(input.mimeType);
    const savedPath = this.mediaStorage.saveBuffer(input.buffer, input.mimeType, input.fileName);
    const sent = await this.requireSocket().sendMessage(input.jid, BaileysOutboundMapper.toBaileysMediaPayload(input, msgType));
    return BaileysOutboundMapper.toDomainMedia(sent?.key?.id, input, savedPath);
  }

  public async markChatRead(jid: string, keys?: Array<{ id: string; fromMe: boolean }>): Promise<void> {
    if (!this.sock || this.status !== 'connected' || !keys?.length) return;
    await this.sock.readMessages(keys.map((k) => ({ remoteJid: jid, id: k.id, fromMe: k.fromMe }))).catch(() => {});
  }

  public resolveMediaFilePath(relativePath: string): string | null {
    return this.mediaStorage.resolveSafePath(relativePath);
  }

  private requireSocket(): WASocket {
    if (!this.sock || this.status !== 'connected') throw new ConflictError('WhatsApp no está conectado. Vincule su teléfono primero.');
    return this.sock;
  }

  private wipeAuthDir(): void {
    this.connectedPhone = null;
    this.connectedName = null;
    fs.rmSync(this.authDir, { recursive: true, force: true });
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  private emitStatus(next: WhatsappConnectionStatus): void {
    this.status = next;
    this.eventBus.publish({ type: 'status', payload: this.getStatus() });
  }
}
