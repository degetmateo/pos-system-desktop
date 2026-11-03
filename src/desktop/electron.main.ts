import { app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog } from 'electron';
import path from 'node:path';
import cron from 'node-cron';
import { updateElectronApp } from 'update-electron-app';
import { SqliteConnection } from '../infrastructure/database/sqlite.connection';
import { SchemaMigrationRunner } from '../infrastructure/database/schema-migration.runner';
import { ExpressApp } from '../presentation/server/express.app';
import { AppContainer } from './app.container';
import { WindowFactory } from './window.factory';

if (require('electron-squirrel-startup')) app.quit();
updateElectronApp({ repo: 'degetmateo/pos-system-desktop' });

let mainWindow: BrowserWindow | null = null;
let container: AppContainer | null = null;

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  const userDataDir = app.getPath('userData');
  const dbPath = path.join(userDataDir, 'data.db');
  const backupsDir = path.join(userDataDir, 'backups');
  const db = SqliteConnection.initialize(dbPath);
  new SchemaMigrationRunner(db).run();

  container = new AppContainer(db, { userDataDir, dbPath, backupsDir });
  cron.schedule('0 * * * *', async () => container?.backupFacade.performBackup());

  const publicPath = app.isPackaged ? path.join(__dirname, '../public') : path.resolve(process.cwd(), 'dist/public');
  const server = new ExpressApp(container.controllers, publicPath);
  await server.listen(4000);

  ipcMain.handle('ping', () => 'pong');
  mainWindow = WindowFactory.createMainWindow(path.join(__dirname, 'preload.js'));

  setTimeout(() => {
    void container?.whatsappAdapter.connectIfSessionExists().catch((err) => {
      console.error('[WhatsApp] Auto-connect error:', err);
    });
  }, 350);

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
}).catch((err) => {
  console.error('Fatal startup error:', err);
  dialog.showErrorBox('Error al iniciar', err?.message || String(err));
});

app.on('before-quit', () => {
  void container?.whatsappAdapter.disconnect();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
