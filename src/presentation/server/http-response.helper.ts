import { Response } from 'express';
import { DomainError } from '../../domain/errors/domain.error';

export class HttpResponseHelper {
  public static ok<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({ data });
  }

  public static created<T>(res: Response, data?: T): void {
    res.status(201).json({ data: data ?? null });
  }

  public static error(res: Response, err: unknown): void {
    console.error(err);
    if (err instanceof DomainError) {
      res.status(err.statusCode).json({
        error: { message: err.message, name: err.name },
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
    res.status(500).json({ error: { message } });
  }

  public static sendExcel(res: Response, buffer: Buffer, filename: string): void {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.status(200).send(buffer);
  }
}

