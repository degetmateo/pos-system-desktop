import express, { Express } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { ProductController } from '../controllers/product.controller';
import { OrderController } from '../controllers/order.controller';
import { CustomerController } from '../controllers/customer.controller';
import { ProviderController } from '../controllers/provider.controller';
import { BarcodeController } from '../controllers/barcode.controller';
import { OptionsController } from '../controllers/options.controller';
import { InfoController } from '../controllers/info.controller';
import { ListController } from '../controllers/list.controller';

export interface ExpressAppControllers {
  productController: ProductController;
  orderController: OrderController;
  customerController: CustomerController;
  providerController: ProviderController;
  barcodeController: BarcodeController;
  optionsController: OptionsController;
  infoController: InfoController;
  listController: ListController;
}

export class ExpressApp {
  public readonly app: Express;
  private readonly publicPath: string;

  constructor(controllers: ExpressAppControllers, customPublicPath?: string) {
    this.app = express();
    this.publicPath = customPublicPath || path.resolve(process.cwd(), 'src/public');

    this.configureMiddlewares();
    this.mountRoutes(controllers);
    this.configureSpaFallback();
  }

  private configureMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(this.publicPath));
    this.app.use('/public', express.static(this.publicPath));
    const logoPng = path.join(this.publicPath, 'logo.png');
    const logoIco = path.join(this.publicPath, 'logo.ico');
    this.app.get('/logo.png', (_req, res) => res.sendFile(fs.existsSync(logoPng) ? logoPng : path.resolve(process.cwd(), 'assets/logo.png')));
    this.app.get('/logo.ico', (_req, res) => res.sendFile(fs.existsSync(logoIco) ? logoIco : path.resolve(process.cwd(), 'assets/logo.ico')));
    this.app.use((_req, res, next) => {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      next();
    });
  }

  private mountRoutes(c: ExpressAppControllers): void {
    this.app.use('/api/products', c.productController.router);
    this.app.use('/api/orders', c.orderController.router);
    this.app.use('/api/customers', c.customerController.router);
    this.app.use('/api/providers', c.providerController.router);
    this.app.use('/api/barcodes', c.barcodeController.router);
    this.app.use('/api/options', c.optionsController.router);
    this.app.use('/api/info', c.infoController.router);
    this.app.use('/api/lists', c.listController.router);
  }

  private configureSpaFallback(): void {
    this.app.use((_req, res) => {
      res.sendFile(path.join(this.publicPath, 'index.html'));
    });
  }

  public listen(port: number = 4000): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, '0.0.0.0', () => {
        console.log(`Server listening on http://0.0.0.0:${port}`);
        resolve();
      });
    });
  }
}

