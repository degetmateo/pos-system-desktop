import { app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog } from 'electron';
import path from 'node:path';
import cron from 'node-cron';
import { updateElectronApp } from 'update-electron-app';
import { SqliteConnection } from '../infrastructure/database/sqlite.connection';
import { SchemaMigrationRunner } from '../infrastructure/database/schema-migration.runner';
import { SqliteMetadataRepository } from '../infrastructure/repositories/sqlite-metadata.repository';
import { SqliteProductRepository } from '../infrastructure/repositories/sqlite-product.repository';
import { SqliteCustomerRepository } from '../infrastructure/repositories/sqlite-customer.repository';
import { SqliteOrderRepository } from '../infrastructure/repositories/sqlite-order.repository';
import { SqliteProviderRepository } from '../infrastructure/repositories/sqlite-provider.repository';
import { SqlitePriceHistoryRepository } from '../infrastructure/repositories/sqlite-price-history.repository';
import { BarcodeService } from '../application/services/barcode.service';
import { ProductService } from '../application/services/product.service';
import { OrderService } from '../application/services/order.service';
import { CustomerService } from '../application/services/customer.service';
import { ProviderService } from '../application/services/provider.service';
import { ExceljsAdapter } from '../infrastructure/adapters/exceljs.adapter';
import { PdfMakeAdapter } from '../infrastructure/adapters/pdfmake.adapter';
import { BackupFacade } from '../infrastructure/maintenance/backup.facade';
import { ProductController } from '../presentation/controllers/product.controller';
import { OrderController } from '../presentation/controllers/order.controller';
import { CustomerController } from '../presentation/controllers/customer.controller';
import { ProviderController } from '../presentation/controllers/provider.controller';
import { BarcodeController } from '../presentation/controllers/barcode.controller';
import { OptionsController } from '../presentation/controllers/options.controller';
import { InfoController } from '../presentation/controllers/info.controller';
import { ListController } from '../presentation/controllers/list.controller';
import { ExpressApp } from '../presentation/server/express.app';
import { WindowFactory } from './window.factory';

if (require('electron-squirrel-startup')) app.quit();
updateElectronApp();

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  const dbPath = path.join(app.getPath('userData'), 'data.db');
  const backupsDir = path.join(app.getPath('userData'), 'backups');
  const db = SqliteConnection.initialize(dbPath);
  new SchemaMigrationRunner(db).run();

  const backupFacade = new BackupFacade(db, backupsDir);
  cron.schedule('0 * * * *', async () => backupFacade.performBackup());

  const metadataRepo = new SqliteMetadataRepository(db);
  const productRepo = new SqliteProductRepository(db);
  const customerRepo = new SqliteCustomerRepository(db);
  const orderRepo = new SqliteOrderRepository(db);
  const providerRepo = new SqliteProviderRepository(db);
  const priceHistoryRepo = new SqlitePriceHistoryRepository(db);

  const barcodeService = new BarcodeService(metadataRepo);
  const productService = new ProductService(productRepo, barcodeService, priceHistoryRepo);
  const orderService = new OrderService(orderRepo, productRepo, customerRepo);
  const customerService = new CustomerService(customerRepo);
  const providerService = new ProviderService(providerRepo);

  const excelAdapter = new ExceljsAdapter();
  const pdfAdapter = new PdfMakeAdapter();

  const publicPath = app.isPackaged ? path.join(__dirname, '../public') : path.resolve(process.cwd(), 'dist/public');
  const server = new ExpressApp(
    {
      productController: new ProductController(productService),
      orderController: new OrderController(orderService, pdfAdapter),
      customerController: new CustomerController(customerService),
      providerController: new ProviderController(providerService),
      barcodeController: new BarcodeController(barcodeService),
      optionsController: new OptionsController(backupFacade, dbPath),
      infoController: new InfoController(),
      listController: new ListController(productService, excelAdapter),
    },
    publicPath
  );

  await server.listen(4000);

  ipcMain.handle('ping', () => 'pong');
  mainWindow = WindowFactory.createMainWindow(path.join(__dirname, 'preload.js'));

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
}).catch((err) => {
  console.error('Fatal startup error:', err);
  dialog.showErrorBox('Error al iniciar', err?.message || String(err));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
