import { Router, Request, Response } from 'express';
import { StatisticsService } from '../../application/services/statistics.service';
import { HttpResponseHelper } from '../server/http-response.helper';

export class StatisticsController {
  public readonly router: Router = Router();

  constructor(private readonly statisticsService: StatisticsService) {
    this.router.get('/', this.getOverview.bind(this));
  }

  private async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const overview = await this.statisticsService.getOverview({
        period: req.query.period as string | undefined,
        startDate: (req.query.startDate || req.query.start) as string | undefined,
        endDate: (req.query.endDate || req.query.end) as string | undefined,
      });
      HttpResponseHelper.ok(res, overview);
    } catch (err) {
      HttpResponseHelper.error(res, err);
    }
  }
}

