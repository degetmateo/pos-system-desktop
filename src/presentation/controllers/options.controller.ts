import { Router, Request, Response } from 'express';
import { BulkProductExportService } from '../../application/services/bulk-product-export.service';
import { BackupFacade } from '../../infrastructure/maintenance/backup.facade';
import { HttpResponseHelper } from '../server/http-response.helper';

export class OptionsController {
  public readonly router: Router = Router();

  constructor(
    private readonly backupFacade: BackupFacade,
    private readonly databasePath: string,
    private readonly bulkExportService?: BulkProductExportService
  ) {
    this.router.get('/download-database', this.downloadDatabase.bind(this));
    this.router.get('/export-products-bulk', this.exportProductsBulk.bind(this));
    this.router.get('/defragment', this.defragment.bind(this));
    this.router.get('/backups', this.listBackups.bind(this));
    this.router.post('/backups', this.createBackup.bind(this));
    this.router.post('/backups/restore', this.restoreBackup.bind(this));
  }

  private downloadDatabase(_req: Request, res: Response): void {
    try {
      res.download(this.databasePath, 'data.db');
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async exportProductsBulk(req: Request, res: Response): Promise<void> {
    try {
      if (!this.bulkExportService) {
        throw new Error('Servicio de exportación masiva no configurado.');
      }
      const format = String(req.query.format || 'json').toLowerCase();
      if (format === 'xlsx' || format === 'excel') {
        const buffer = await this.bulkExportService.exportToExcel();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="productos-bulk-import.xlsx"');
        res.send(buffer);
        return;
      }
      const data = await this.bulkExportService.exportToJson();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="productos-bulk-import.json"');
      res.send(JSON.stringify(data, null, 2));
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private defragment(_req: Request, res: Response): void {
    try {
      this.backupFacade.defragment();
      HttpResponseHelper.ok(res, { success: true });
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private listBackups(_req: Request, res: Response): void {
    try {
      const backups = this.backupFacade.listBackups();
      HttpResponseHelper.ok(res, backups);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async createBackup(_req: Request, res: Response): Promise<void> {
    try {
      const filepath = await this.backupFacade.performBackup();
      HttpResponseHelper.ok(res, { filepath, success: true });
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }

  private async restoreBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.body;
      if (!filename) throw new Error('Debe proporcionar el nombre del archivo de respaldo.');
      await this.backupFacade.restoreBackup(filename);
      HttpResponseHelper.ok(res, { success: true });
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}
