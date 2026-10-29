import { Router, Request, Response } from 'express';
import { CustomerService } from '../../application/services/customer.service';
import { HttpResponseHelper } from '../server/http-response.helper';

export class CustomerController {
  public readonly router: Router = Router();

  constructor(private readonly customerService: CustomerService) {
    this.router.get('/', this.list.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.post('/', this.create.bind(this));
    this.router.post('/update/:id', this.update.bind(this));
  }

  private async list(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : (page ? 15 : undefined);
      const offset = page && limit ? (page - 1) * limit : (req.query.offset ? Number(req.query.offset) : undefined);
      const hasCuilParam = req.query.has_cuil ?? req.query.hasCuil;
      const hasPhoneParam = req.query.has_phone ?? req.query.hasPhone;
      const hasEmailParam = req.query.has_email ?? req.query.hasEmail;

      const filters = {
        id: req.query.id as string,
        name: req.query.name as string,
        search: (req.query.search || req.query.q || req.query.name) as string,
        type: req.query.type as string,
        hasCuil: hasCuilParam !== undefined ? hasCuilParam === 'true' || hasCuilParam === '1' : undefined,
        hasPhone: hasPhoneParam !== undefined ? hasPhoneParam === 'true' || hasPhoneParam === '1' : undefined,
        hasEmail: hasEmailParam !== undefined ? hasEmailParam === 'true' || hasEmailParam === '1' : undefined,
        sorting: req.query.sorting as any,
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
        const customers = await this.customerService.listCustomers(filters);
        HttpResponseHelper.ok(res, customers);
      }
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const customer = await this.customerService.getCustomerById(id);
      HttpResponseHelper.ok(res, customer);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const customer = await this.customerService.createCustomer(req.body);
      HttpResponseHelper.created(res, customer);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const customer = await this.customerService.updateCustomer({ ...req.body, id });
      HttpResponseHelper.ok(res, customer);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}
