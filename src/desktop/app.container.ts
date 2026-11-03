import path from 'node:path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { BarcodeService } from '../application/services/barcode.service';
import { CustomerService } from '../application/services/customer.service';
import { OrderService } from '../application/services/order.service';
import { ProductService } from '../application/services/product.service';
import { ProviderService } from '../application/services/provider.service';
import { StatisticsService } from '../application/services/statistics.service';
import { WhatsappCustomerSyncService } from '../application/services/whatsapp-customer-sync.service';
import { WhatsappEventBus } from '../application/services/whatsapp-event.bus';
import { WhatsappService } from '../application/services/whatsapp.service';
import { ExceljsAdapter } from '../infrastructure/adapters/exceljs.adapter';
import { PdfMakeAdapter } from '../infrastructure/adapters/pdfmake.adapter';
import { BaileysEventHandler } from '../infrastructure/adapters/whatsapp/baileys-event.handler';
import { BaileysLidReconciler } from '../infrastructure/adapters/whatsapp/baileys-lid.reconciler';
import { BaileysWhatsappAdapter } from '../infrastructure/adapters/whatsapp/baileys-whatsapp.adapter';
import { WhatsappMediaStorage } from '../infrastructure/adapters/whatsapp/whatsapp-media.storage';
import { BackgroundTaskQueue } from '../infrastructure/concurrency/background-task.queue';
import { BackupFacade } from '../infrastructure/maintenance/backup.facade';
import { SqliteCustomerRepository } from '../infrastructure/repositories/sqlite-customer.repository';
import { SqliteMetadataRepository } from '../infrastructure/repositories/sqlite-metadata.repository';
import { SqliteOrderRepository } from '../infrastructure/repositories/sqlite-order.repository';
import { SqlitePriceHistoryRepository } from '../infrastructure/repositories/sqlite-price-history.repository';
import { SqliteProductRepository } from '../infrastructure/repositories/sqlite-product.repository';
import { SqliteProviderRepository } from '../infrastructure/repositories/sqlite-provider.repository';
import { SqliteStatisticsRepository } from '../infrastructure/repositories/sqlite-statistics.repository';
import { SqliteWhatsappChatRepository } from '../infrastructure/repositories/sqlite-whatsapp-chat.repository';
import { SqliteWhatsappIdentityRepository } from '../infrastructure/repositories/sqlite-whatsapp-identity.repository';
import { SqliteWhatsappMessageRepository } from '../infrastructure/repositories/sqlite-whatsapp-message.repository';
import { BarcodeController } from '../presentation/controllers/barcode.controller';
import { CustomerController } from '../presentation/controllers/customer.controller';
import { InfoController } from '../presentation/controllers/info.controller';
import { ListController } from '../presentation/controllers/list.controller';
import { OptionsController } from '../presentation/controllers/options.controller';
import { OrderController } from '../presentation/controllers/order.controller';
import { ProductController } from '../presentation/controllers/product.controller';
import { ProviderController } from '../presentation/controllers/provider.controller';
import { StatisticsController } from '../presentation/controllers/statistics.controller';
import { WhatsappController } from '../presentation/controllers/whatsapp.controller';
import { ExpressAppControllers } from '../presentation/server/express.app';

export interface AppContainerPaths {
  userDataDir: string;
  dbPath: string;
  backupsDir: string;
}

export class AppContainer {
  public readonly backupFacade: BackupFacade;
  public readonly whatsappAdapter: BaileysWhatsappAdapter;
  public readonly controllers: ExpressAppControllers;

  constructor(db: DatabaseInstance, paths: AppContainerPaths) {
    this.backupFacade = new BackupFacade(db, paths.backupsDir);

    const metadataRepo = new SqliteMetadataRepository(db);
    const productRepo = new SqliteProductRepository(db);
    const customerRepo = new SqliteCustomerRepository(db);
    const orderRepo = new SqliteOrderRepository(db);
    const providerRepo = new SqliteProviderRepository(db);
    const priceHistoryRepo = new SqlitePriceHistoryRepository(db);
    const whatsappChatRepo = new SqliteWhatsappChatRepository(db);
    const whatsappMessageRepo = new SqliteWhatsappMessageRepository(db);
    const whatsappIdentityRepo = new SqliteWhatsappIdentityRepository(db);
    const statisticsRepo = new SqliteStatisticsRepository(db);

    const barcodeService = new BarcodeService(metadataRepo);
    const productService = new ProductService(productRepo, barcodeService, priceHistoryRepo);
    const orderService = new OrderService(orderRepo, productRepo, customerRepo);
    const customerService = new CustomerService(customerRepo);
    const providerService = new ProviderService(providerRepo);
    const statisticsService = new StatisticsService(statisticsRepo);

    const whatsappEventBus = new WhatsappEventBus();
    const whatsappCustomerSync = new WhatsappCustomerSyncService(customerRepo, whatsappChatRepo);
    const lidReconciler = new BaileysLidReconciler(
      whatsappIdentityRepo, whatsappChatRepo, whatsappCustomerSync, whatsappEventBus
    );
    const whatsappMedia = new WhatsappMediaStorage(path.join(paths.userDataDir, 'whatsapp-media'));
    const whatsappTaskQueue = new BackgroundTaskQueue();
    const baileysEvents = new BaileysEventHandler(
      whatsappChatRepo, whatsappMessageRepo, whatsappMedia, whatsappEventBus,
      whatsappIdentityRepo, lidReconciler, whatsappCustomerSync, whatsappTaskQueue
    );
    this.whatsappAdapter = new BaileysWhatsappAdapter(
      path.join(paths.userDataDir, 'whatsapp-auth'),
      whatsappMedia, baileysEvents, whatsappEventBus, lidReconciler, whatsappTaskQueue
    );
    const whatsappService = new WhatsappService(
      this.whatsappAdapter, whatsappChatRepo, whatsappMessageRepo, whatsappEventBus, customerRepo
    );

    this.controllers = {
      productController: new ProductController(productService),
      orderController: new OrderController(orderService, new PdfMakeAdapter()),
      customerController: new CustomerController(customerService),
      providerController: new ProviderController(providerService),
      barcodeController: new BarcodeController(barcodeService),
      optionsController: new OptionsController(this.backupFacade, paths.dbPath),
      infoController: new InfoController(),
      listController: new ListController(productService, new ExceljsAdapter()),
      whatsappController: new WhatsappController(whatsappService, whatsappEventBus),
      statisticsController: new StatisticsController(statisticsService),
    };
  }
}
