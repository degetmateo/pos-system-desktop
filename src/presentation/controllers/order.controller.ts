import { Router, Request, Response } from 'express';
import { OrderService } from '../../application/services/order.service';
import { IPdfGeneratorPort } from '../../application/ports/pdf-generator.port';
import { HttpResponseHelper } from '../server/http-response.helper';

export class OrderController {
  public readonly router: Router = Router();

  constructor(
    private readonly orderService: OrderService,
    private readonly pdfGenerator: IPdfGeneratorPort
  ) {
    this.router.get('/', this.list.bind(this));
    this.router.get('/report', this.report.bind(this));
    this.router.get('/receipt/:id', this.receipt.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.post('/', this.create.bind(this));
  }

  private async report(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.orderService.getDailyReport(req.query.start as string, req.query.end as string);
      HttpResponseHelper.ok(res, data);
    } catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async list(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : (page ? 15 : 20);
      const offset = page ? (page - 1) * limit : (req.query.offset ? Number(req.query.offset) : 0);
      const filters = {
        id: req.query.id as string,
        customerId: req.query.customer_id as string,
        customerName: req.query.customer_name as string,
        search: (req.query.search || req.query.q || req.query.customer_name) as string,
        orderNumber: req.query.number ? Number(req.query.number) : undefined,
        type: req.query.type as string,
        status: req.query.status as string,
        paymentMethod: (req.query.payment_method || req.query.paymentMethod) as string,
        startDate: (req.query.start_date || req.query.startDate) as string,
        endDate: (req.query.end_date || req.query.endDate) as string,
        minTotal: req.query.min_total ? Math.round(Number(req.query.min_total) * 100) : undefined,
        maxTotal: req.query.max_total ? Math.round(Number(req.query.max_total) * 100) : undefined,
        sorting: req.query.sorting as any,
        limit,
        offset,
      };
      if (page) {
        const [items, total] = await Promise.all([
          this.orderService.listOrders(filters),
          this.orderService.countOrders(filters),
        ]);
        HttpResponseHelper.ok(res, { items, total, page, totalPages: Math.ceil(total / limit) || 1 });
      } else {
        const orders = await this.orderService.listOrders(filters);
        HttpResponseHelper.ok(res, orders);
      }
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.getOrderById(id);
      HttpResponseHelper.ok(res, order);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.orderService.createOrder(req.body);
      HttpResponseHelper.created(res, order);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async receipt(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.getOrderById(id);
      const action = req.query.action as string;

      if (action === 'print') {
        const html = this.pdfGenerator.generateReceiptHtml(order);
        const autoPrintHtml = `${html}<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},500);};</script>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(autoPrintHtml);
      } else {
        const pdfBuffer = await this.pdfGenerator.generateReceiptPdf(order);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Orden_${order.number}.pdf"`);
        res.send(pdfBuffer);
      }
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}
