import { Router, Request, Response } from 'express';
import multer from 'multer';
import { WhatsappService } from '../../application/services/whatsapp.service';
import { WhatsappEventBus } from '../../application/services/whatsapp-event.bus';
import { InvalidArgumentError } from '../../domain/errors/invalid-argument.error';
import { HttpResponseHelper } from '../server/http-response.helper';
import { WhatsappSseBroadcaster } from '../server/whatsapp-sse.broadcaster';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export class WhatsappController {
  public readonly router: Router = Router();
  private readonly sse: WhatsappSseBroadcaster;

  constructor(private readonly whatsappService: WhatsappService, eventBus: WhatsappEventBus) {
    this.sse = new WhatsappSseBroadcaster(eventBus);
    this.router.get('/status', (_req, res) => HttpResponseHelper.ok(res, this.whatsappService.getStatus()));
    this.router.get('/events', (req, res) => this.sse.addClient(req, res, this.whatsappService.getStatus()));
    this.router.post('/connect', this.connect.bind(this));
    this.router.post('/logout', this.logout.bind(this));
    this.router.get('/chats', this.listChats.bind(this));
    this.router.post('/chats/start', this.startChat.bind(this));
    this.router.patch('/chats/:jid/importance', this.updateImportance.bind(this));
    this.router.post('/chats/:jid/importance', this.updateImportance.bind(this));
    this.router.get('/chats/:jid/messages', this.getMessages.bind(this));
    this.router.post('/chats/:jid/read', this.markRead.bind(this));
    this.router.post('/chats/:jid/messages', this.sendText.bind(this));
    this.router.post('/chats/:jid/media', upload.single('file'), this.sendMedia.bind(this));
    this.router.get('/media/:filename', this.serveMedia.bind(this));
  }

  private paramStr(val: string | string[]): string {
    return decodeURIComponent(Array.isArray(val) ? val[0] : val);
  }

  private async connect(_req: Request, res: Response): Promise<void> {
    try { HttpResponseHelper.ok(res, await this.whatsappService.connect()); }
    catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async logout(req: Request, res: Response): Promise<void> {
    try { HttpResponseHelper.ok(res, await this.whatsappService.logout(Boolean(req.body?.clearHistory))); }
    catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async listChats(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search || req.query.q) as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const importance = req.query.importance as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 150;
      HttpResponseHelper.ok(res, await this.whatsappService.listChats({ search, sortBy, importance, limit }));
    } catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async startChat(req: Request, res: Response): Promise<void> {
    try { HttpResponseHelper.created(res, await this.whatsappService.startChatByPhone(req.body?.phone, req.body?.name)); }
    catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async updateImportance(req: Request, res: Response): Promise<void> {
    try {
      const updated = await this.whatsappService.updateChatImportance(this.paramStr(req.params.jid), req.body?.importance);
      HttpResponseHelper.ok(res, updated);
    } catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 80;
      const before = req.query.before ? Number(req.query.before) : undefined;
      HttpResponseHelper.ok(res, await this.whatsappService.getMessages(this.paramStr(req.params.jid), limit, before));
    } catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async markRead(req: Request, res: Response): Promise<void> {
    try {
      await this.whatsappService.markChatAsRead(this.paramStr(req.params.jid));
      HttpResponseHelper.ok(res, { success: true });
    } catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async sendText(req: Request, res: Response): Promise<void> {
    try {
      const msg = await this.whatsappService.sendText(this.paramStr(req.params.jid), req.body?.text);
      HttpResponseHelper.created(res, msg);
    } catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async sendMedia(req: Request, res: Response): Promise<void> {
    try {
      const jid = this.paramStr(req.params.jid);
      const buffer = req.file?.buffer || (req.body?.base64 ? Buffer.from(req.body.base64, 'base64') : null);
      if (!buffer) throw new InvalidArgumentError('Debe adjuntar un archivo multimedia.');
      const mimeType = req.file?.mimetype || req.body?.mimeType || 'application/octet-stream';
      const fileName = req.file?.originalname || req.body?.fileName || 'archivo';
      const msg = await this.whatsappService.sendMedia({ jid, buffer, mimeType, fileName, caption: req.body?.caption });
      HttpResponseHelper.created(res, msg);
    } catch (err) { HttpResponseHelper.error(res, err); }
  }

  private serveMedia(req: Request, res: Response): void {
    try { res.sendFile(this.whatsappService.resolveMediaPath(this.paramStr(req.params.filename))); }
    catch (err) { HttpResponseHelper.error(res, err); }
  }
}
