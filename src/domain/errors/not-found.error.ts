import { DomainError } from './domain.error';

export class NotFoundError extends DomainError {
  constructor(message: string = 'Recurso no encontrado.') {
    super(message, 404);
  }
}

