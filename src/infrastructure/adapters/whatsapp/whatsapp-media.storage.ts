import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { WhatsappMessageType } from '../../../domain/models/whatsapp-message.entity';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'video/mp4': '.mp4',
};

export class WhatsappMediaStorage {
  constructor(private readonly mediaDir: string) {
    fs.mkdirSync(this.mediaDir, { recursive: true });
  }

  public saveBuffer(buffer: Buffer, mimeType?: string | null, originalName?: string | null): string {
    fs.mkdirSync(this.mediaDir, { recursive: true });
    const extFromName = originalName ? path.extname(originalName) : '';
    const cleanMime = (mimeType || '').split(';')[0].trim().toLowerCase();
    const ext = extFromName || MIME_EXTENSIONS[cleanMime] || '.bin';
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10) || '.bin';
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${safeExt}`;
    fs.writeFileSync(path.join(this.mediaDir, filename), buffer);
    return filename;
  }

  public resolveSafePath(relativeFilename: string): string | null {
    if (!relativeFilename || relativeFilename.includes('..') || path.isAbsolute(relativeFilename)) {
      return null;
    }
    const baseDir = path.resolve(this.mediaDir);
    const candidate = path.resolve(baseDir, path.basename(relativeFilename));
    if (!candidate.startsWith(baseDir + path.sep) && candidate !== baseDir) {
      return null;
    }
    return fs.existsSync(candidate) ? candidate : null;
  }

  public static classifyMime(mimeType: string): WhatsappMessageType {
    const clean = (mimeType || '').toLowerCase();
    if (clean.startsWith('image/')) return 'image';
    if (clean.startsWith('audio/')) return 'audio';
    if (clean.startsWith('video/')) return 'video';
    return 'document';
  }
}

