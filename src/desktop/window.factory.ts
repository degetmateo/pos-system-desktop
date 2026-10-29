import { BrowserWindow } from 'electron';

export class WindowFactory {
  public static createMainWindow(preloadPath: string): BrowserWindow {
    const win = new BrowserWindow({
      width: 1400,
      height: 800,
      autoHideMenuBar: true,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.warn(`[Electron] Page failed to load: ${errorDescription} (${errorCode}). Retrying in 500ms...`);
      setTimeout(() => {
        if (!win.isDestroyed()) {
          win.loadURL('http://localhost:4000');
        }
      }, 500);
    });

    win.loadURL('http://localhost:4000');
    return win;
  }
}
