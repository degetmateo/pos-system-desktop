import { Router, Request, Response } from 'express';
import { BackupFacade } from '../../infrastructure/maintenance/backup.facade';
import { HttpResponseHelper } from '../server/http-response.helper';

export class OptionsController {
  public readonly router: Router = Router();

  constructor(
    private readonly backupFacade: BackupFacade,
    private readonly databasePath: string
  ) {
    this.router.get('/download-database', this.downloadDatabase.bind(this));
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
