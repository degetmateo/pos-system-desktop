import { Router, Request, Response } from 'express';
import { CustomerService } from '../../application/services/customer.service';
import { HttpResponseHelper } from '../server/http-response.helper';

export class CustomerController {
  public readonly router: Router = Router();

  constructor(private readonly customerService: CustomerService) {
    this.router.get('/', this.list.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.post('/', this.create.bind(this));
    this.router.put('/:id', this.update.bind(this));
    this.router.post('/update/:id', this.update.bind(this));
    this.router.delete('/:id', this.remove.bind(this));
  }

  private async list(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
      const limit = req.query.limit ? Math.min(500, Math.max(1, Number(req.query.limit))) : (page ? 15 : 200);
      const offset = page && limit ? (page - 1) * limit : (req.query.offset ? Number(req.query.offset) : undefined);
      const hasCuilParam = req.query.has_cuil ?? req.query.hasCuil;
      const hasPhoneParam = req.query.has_phone ?? req.query.hasPhone;
      const hasEmailParam = req.query.has_email ?? req.query.hasEmail;

      const filters = {
        id: req.query.id as string,
        name: req.query.name as string,
        search: (req.query.search || req.query.q || req.query.name) as string,
        type: req.query.type as string,
        importance: req.query.importance as string,
        hasCuil: hasCuilParam !== undefined ? hasCuilParam === 'true' || hasCuilParam === '1' : undefined,
        hasPhone: hasPhoneParam !== undefined ? hasPhoneParam === 'true' || hasPhoneParam === '1' : undefined,
        hasEmail: hasEmailParam !== undefined ? hasEmailParam === 'true' || hasEmailParam === '1' : undefined,
        sorting: req.query.sorting as string,
        limit,
        offset,
      };
      if (page && limit) {
        const [items, total] = await Promise.all([
          this.customerService.listCustomers(filters),
          this.customerService.countCustomers(filters),
        ]);
        HttpResponseHelper.ok(res, { items, total, page, totalPages: Math.ceil(total / limit) || 1 });
      } else {
        HttpResponseHelper.ok(res, await this.customerService.listCustomers(filters));
      }
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private paramId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  private async getById(req: Request, res: Response): Promise<void> {
    try { HttpResponseHelper.ok(res, await this.customerService.getCustomerById(this.paramId(req))); }
    catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try { HttpResponseHelper.created(res, await this.customerService.createCustomer(req.body)); }
    catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try { HttpResponseHelper.ok(res, await this.customerService.updateCustomer({ ...req.body, id: this.paramId(req) })); }
    catch (err) { HttpResponseHelper.error(res, err); }
  }

  private async remove(req: Request, res: Response): Promise<void> {
    try {
      await this.customerService.deleteCustomer(this.paramId(req));
      HttpResponseHelper.ok(res, { deleted: true });
    } catch (err) { HttpResponseHelper.error(res, err); }
  }
}
