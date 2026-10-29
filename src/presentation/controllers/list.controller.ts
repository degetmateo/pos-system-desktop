import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ProductService } from '../../application/services/product.service';
import { IExcelGeneratorPort } from '../../application/ports/excel-generator.port';
import { HttpResponseHelper } from '../server/http-response.helper';

const upload = multer({ storage: multer.memoryStorage() });

export class ListController {
  public readonly router: Router = Router();

  constructor(
    private readonly productService: ProductService,
    private readonly excelGenerator: IExcelGeneratorPort
  ) {
    this.router.get('/products-internal', this.downloadInternalList.bind(this));
    this.router.get('/products-customers', this.downloadCustomerList.bind(this));
    this.router.post(
      '/products-internal',
      upload.single('excel'),
      this.importInternalList.bind(this)
    );
  }

  private async downloadInternalList(_req: Request, res: Response): Promise<void> {
    try {
      const products = await this.productService.listProducts();
      const buffer = await this.excelGenerator.createInternalBook(products);
      HttpResponseHelper.sendExcel(res, buffer, `LISTA_INTERNA_RD_${Date.now()}`);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async downloadCustomerList(_req: Request, res: Response): Promise<void> {
    try {
      const products = await this.productService.listProducts();
      const buffer = await this.excelGenerator.createCustomerBook(products);
      HttpResponseHelper.sendExcel(res, buffer, 'LISTA_DE_PRECIOS_RUBEN_DARIO');
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async importInternalList(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: { message: 'No se subió ningún archivo.' } });
        return;
      }
      const parsedItems = await this.excelGenerator.parseInternalBook(req.file.buffer);
      for (const item of parsedItems) {
        await this.productService.updateProduct({
          id: item.id,
          name: item.name,
          barcode: item.barcode,
          major_price: item.price_major,
          minor_price: item.price_minor,
          minor_price_condition_1: item.discount_cond_1,
          minor_price_value_1: item.discount_price_1,
          minor_price_condition_2: item.discount_cond_2,
          minor_price_value_2: item.discount_price_2,
        });
      }
      HttpResponseHelper.ok(res, { processedCount: parsedItems.length });
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}

