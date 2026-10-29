import { Router, Request, Response } from 'express';
import { ProviderService } from '../../application/services/provider.service';
import { HttpResponseHelper } from '../server/http-response.helper';

export class ProviderController {
  public readonly router: Router = Router();

  constructor(private readonly providerService: ProviderService) {
    this.router.get('/', this.list.bind(this));
    this.router.post('/', this.create.bind(this));
    this.router.delete('/:id', this.delete.bind(this));
  }

  private async list(_req: Request, res: Response): Promise<void> {
    try {
      const providers = await this.providerService.listProviders();
      HttpResponseHelper.ok(res, providers);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const provider = await this.providerService.createProvider(req.body);
      HttpResponseHelper.created(res, provider);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.providerService.deleteProvider(id);
      HttpResponseHelper.ok(res, { success: true });
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}
