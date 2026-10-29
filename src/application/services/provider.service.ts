import { v7 as uuidv7 } from 'uuid';
import { Provider } from '../../domain/models/provider.entity';
import { IProviderRepository } from '../ports/provider-repository.port';
import { CreateProviderDto } from '../dtos/provider.dto';
import { ConflictError } from '../../domain/errors/conflict.error';
import { NotFoundError } from '../../domain/errors/not-found.error';

export class ProviderService {
  constructor(private readonly providerRepo: IProviderRepository) {}

  public async listProviders(): Promise<Provider[]> {
    return this.providerRepo.findAll();
  }

  public async createProvider(dto: CreateProviderDto): Promise<Provider> {
    const existing = await this.providerRepo.findByName(dto.name.trim().toUpperCase());
    if (existing) {
      throw new ConflictError('Ya existe un proveedor con ese nombre.');
    }

    const provider = new Provider({
      id: uuidv7(),
      name: dto.name,
      barcodePrefix: dto.barcode_prefix,
    });

    await this.providerRepo.save(provider);
    return provider;
  }

  public async deleteProvider(id: string): Promise<void> {
    const existing = await this.providerRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Proveedor no encontrado.');
    }
    await this.providerRepo.delete(id);
  }
}
