import { Provider } from '../../domain/models/provider.entity';

export interface IProviderRepository {
  findById(id: string): Promise<Provider | null>;
  findByName(name: string): Promise<Provider | null>;
  findAll(): Promise<Provider[]>;
  save(provider: Provider): Promise<void>;
  delete(id: string): Promise<void>;
}

