import { Database as DatabaseInstance } from 'better-sqlite3';
import { BarcodeService } from '../application/services/barcode.service';
import { BulkProductExportService } from '../application/services/bulk-product-export.service';
import { CustomerService } from '../application/services/customer.service';
import { OrderService } from '../application/services/order.service';
import { ProductService } from '../application/services/product.service';
import { ProviderService } from '../application/services/provider.service';
import { StatisticsService } from '../application/services/statistics.service';
import { ExceljsAdapter } from '../infrastructure/adapters/exceljs.adapter';
import { PdfMakeAdapter } from '../infrastructure/adapters/pdfmake.adapter';
import { BackupFacade } from '../infrastructure/maintenance/backup.facade';
import { SqliteCustomerRepository } from '../infrastructure/repositories/sqlite-customer.repository';
import { SqliteMetadataRepository } from '../infrastructure/repositories/sqlite-metadata.repository';
import { SqliteOrderRepository } from '../infrastructure/repositories/sqlite-order.repository';
import { SqlitePriceHistoryRepository } from '../infrastructure/repositories/sqlite-price-history.repository';
import { SqliteProductRepository } from '../infrastructure/repositories/sqlite-product.repository';
import { SqliteProviderRepository } from '../infrastructure/repositories/sqlite-provider.repository';
import { SqliteStatisticsRepository } from '../infrastructure/repositories/sqlite-statistics.repository';
import { BarcodeController } from '../presentation/controllers/barcode.controller';
import { CustomerController } from '../presentation/controllers/customer.controller';
import { InfoController } from '../presentation/controllers/info.controller';
import { ListController } from '../presentation/controllers/list.controller';
import { OptionsController } from '../presentation/controllers/options.controller';
import { OrderController } from '../presentation/controllers/order.controller';
import { ProductController } from '../presentation/controllers/product.controller';
import { ProviderController } from '../presentation/controllers/provider.controller';
import { StatisticsController } from '../presentation/controllers/statistics.controller';
import { ExpressAppControllers } from '../presentation/server/express.app';

export interface AppContainerPaths {
  userDataDir: string;
  dbPath: string;
  backupsDir: string;
}

export class AppContainer {
  public readonly backupFacade: BackupFacade;
  public readonly controllers: ExpressAppControllers;

  constructor(db: DatabaseInstance, paths: AppContainerPaths) {
    this.backupFacade = new BackupFacade(db, paths.backupsDir);

    const metadataRepo = new SqliteMetadataRepository(db);
    const productRepo = new SqliteProductRepository(db);
    const customerRepo = new SqliteCustomerRepository(db);
    const orderRepo = new SqliteOrderRepository(db);
    const providerRepo = new SqliteProviderRepository(db);
    const priceHistoryRepo = new SqlitePriceHistoryRepository(db);
    const statisticsRepo = new SqliteStatisticsRepository(db);

    const barcodeService = new BarcodeService(metadataRepo);
    const productService = new ProductService(productRepo, barcodeService, priceHistoryRepo);
    const orderService = new OrderService(orderRepo, productRepo, customerRepo);
    const customerService = new CustomerService(customerRepo);
    const providerService = new ProviderService(providerRepo);
    const statisticsService = new StatisticsService(statisticsRepo);
    const bulkExportService = new BulkProductExportService(productRepo, providerRepo);

    this.controllers = {
      productController: new ProductController(productService),
      orderController: new OrderController(orderService, new PdfMakeAdapter()),
      customerController: new CustomerController(customerService),
      providerController: new ProviderController(providerService),
      barcodeController: new BarcodeController(barcodeService),
      optionsController: new OptionsController(this.backupFacade, paths.dbPath, bulkExportService),
      infoController: new InfoController(),
      listController: new ListController(productService, new ExceljsAdapter()),
      statisticsController: new StatisticsController(statisticsService),
    };
  }
}
