import { IMetadataRepository } from '../ports/metadata-repository.port';
import { Barcode } from '../../domain/value-objects/barcode.vo';

export class BarcodeService {
  constructor(private readonly metadataRepo: IMetadataRepository) {}

  public async generateNextBarcode(): Promise<Barcode> {
    const counter = await this.metadataRepo.incrementInt('barcode');
    const currentYear = new Date().getFullYear();
    return Barcode.generateInternal(counter, currentYear);
  }
}

