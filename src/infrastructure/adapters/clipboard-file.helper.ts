import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';

export class ClipboardFileHelper {
  public static async copyPdfToClipboard(pdfBuffer: Buffer, orderNumber: number): Promise<string> {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `Orden_${orderNumber}.pdf`);
    await fs.promises.writeFile(filePath, pdfBuffer);

    if (process.platform === 'win32') {
      await new Promise<void>((resolve) => {
        const safePath = filePath.replace(/'/g, "''");
        execFile('powershell', ['-NoProfile', '-Command', `Set-Clipboard -Path '${safePath}'`], (error) => {
          if (error) {
            console.error('[ClipboardFileHelper] Set-Clipboard warning:', error.message);
          }
          resolve();
        });
      });
    }

    return filePath;
  }
}

