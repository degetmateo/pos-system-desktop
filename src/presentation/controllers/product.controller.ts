import { Router, Request, Response } from 'express';
import { ProductService } from '../../application/services/product.service';
import { HttpResponseHelper } from '../server/http-response.helper';

export class ProductController {
  public readonly router: Router = Router();

  constructor(private readonly productService: ProductService) {
    this.router.get('/', this.list.bind(this));
    this.router.get('/:id/price-history', this.getPriceHistory.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.post('/', this.create.bind(this));
    this.router.post('/update/:id', this.update.bind(this));
    this.router.delete('/:id', this.delete.bind(this));
  }

  private async list(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : (page ? 15 : 20);
      const offset = page ? (page - 1) * limit : (req.query.offset ? Number(req.query.offset) : 0);
      const filters = {
        id: req.query.id as string,
        barcode: req.query.barcode as string,
        name: (req.query.name || req.query.nameFilter) as string,
        search: (req.query.search || req.query.q || req.query.name || req.query.nameFilter) as string,
        providerId: (req.query.provider_id || req.query.providerId) as string,
        stockStatus: (req.query.stock_status || req.query.stockStatus) as any,
        minPrice: req.query.min_price ? Math.round(Number(req.query.min_price) * 100) : undefined,
        maxPrice: req.query.max_price ? Math.round(Number(req.query.max_price) * 100) : undefined,
        sorting: req.query.sorting as any,
        limit,
        offset,
      };
      if (page) {
        const [items, total] = await Promise.all([
          this.productService.listProducts(filters),
          this.productService.countProducts(filters),
        ]);
        HttpResponseHelper.ok(res, { items, total, page, totalPages: Math.ceil(total / limit) || 1 });
      } else {
        const products = await this.productService.listProducts(filters);
        HttpResponseHelper.ok(res, products);
      }
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const product = await this.productService.getProductById(id);
      HttpResponseHelper.ok(res, product);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async getPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const history = await this.productService.getPriceHistory(id);
      HttpResponseHelper.ok(res, history);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.productService.createProduct(req.body);
      HttpResponseHelper.created(res, product);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const product = await this.productService.updateProduct({ ...req.body, id });
      HttpResponseHelper.ok(res, product);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.productService.deleteProduct(id);
      HttpResponseHelper.ok(res, { success: true });
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}
