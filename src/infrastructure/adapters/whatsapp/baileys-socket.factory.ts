import fs from 'node:fs';
import type { WASocket } from '@whiskeysockets/baileys';
import { WhatsappJid } from '../../../domain/value-objects/whatsapp-jid.vo';
import { BaileysModule, BaileysModuleLoader } from './baileys-module.loader';

export interface CreatedBaileysSocket {
  sock: WASocket;
  baileys: BaileysModule;
}

/**
 * Factory Method (GoF): Encapsula la instanciación y configuración del socket Baileys,
 * filtrando de raíz estados (`status@broadcast`), difusiones y canales (`@newsletter`).
 */
export class BaileysSocketFactory {
  public static async create(authDir: string): Promise<CreatedBaileysSocket> {
    const baileys = await BaileysModuleLoader.load();
    fs.mkdirSync(authDir, { recursive: true });
    const { state, saveCreds } = await baileys.useMultiFileAuthState(authDir);
    const vInfo = await baileys.fetchLatestBaileysVersion().catch(() => undefined);

    const sock = baileys.makeWASocket({
      ...(vInfo?.version ? { version: vInfo.version } : {}),
      auth: state,
      logger: BaileysModuleLoader.createSilentLogger(),
      printQRInTerminal: false,
      browser: baileys.Browsers.ubuntu('RD POS Desktop'),
      syncFullHistory: true,
      shouldIgnoreJid: (jid: string) =>
        Boolean(
          WhatsappJid.isStatusOrBroadcastRaw(jid) ||
          baileys.isJidStatusBroadcast?.(jid) ||
          baileys.isJidBroadcast?.(jid) ||
          baileys.isJidNewsletter?.(jid)
        ),
    });
    sock.ev.on('creds.update', saveCreds);

    return { sock, baileys };
  }
}
