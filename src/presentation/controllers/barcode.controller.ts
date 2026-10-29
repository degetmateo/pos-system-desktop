import { Router, Request, Response } from 'express';
import { BarcodeService } from '../../application/services/barcode.service';
import { HttpResponseHelper } from '../server/http-response.helper';

export class BarcodeController {
  public readonly router: Router = Router();

  constructor(private readonly barcodeService: BarcodeService) {
    this.router.get('/new', this.getNewBarcode.bind(this));
  }

  private async getNewBarcode(_req: Request, res: Response): Promise<void> {
    try {
      const barcode = await this.barcodeService.generateNextBarcode();
      HttpResponseHelper.ok(res, barcode.getValue());
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}

