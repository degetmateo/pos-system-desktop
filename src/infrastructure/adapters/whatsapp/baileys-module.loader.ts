import type { ILogger } from '@whiskeysockets/baileys/lib/Utils/logger.js';

export type BaileysModule = typeof import('@whiskeysockets/baileys');

export class BaileysModuleLoader {
  private static cachedModule: BaileysModule | null = null;

  public static async load(): Promise<BaileysModule> {
    if (!this.cachedModule) {
      this.cachedModule = await import('@whiskeysockets/baileys');
    }
    return this.cachedModule;
  }

  public static createSilentLogger(): ILogger {
    const noop = () => {};
    const logger: ILogger = {
      level: 'silent',
      child: () => logger,
      trace: noop,
      debug: noop,
      info: noop,
      warn: noop,
      error: noop,
    };
    return logger;
  }
}

