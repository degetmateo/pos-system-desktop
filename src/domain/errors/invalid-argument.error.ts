import { DomainError } from './domain.error';

export class InvalidArgumentError extends DomainError {
  constructor(message: string = 'Argumento inválido o incompleto.') {
    super(message, 400);
  }
}

