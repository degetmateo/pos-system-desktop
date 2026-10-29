import { DomainError } from './domain.error';

export class ConflictError extends DomainError {
  constructor(message: string = 'Conflicto con un recurso existente.') {
    super(message, 409);
  }
}

