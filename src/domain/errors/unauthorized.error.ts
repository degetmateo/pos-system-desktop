import { DomainError } from './domain.error';

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Acceso no autorizado.') {
    super(message, 401);
  }
}

