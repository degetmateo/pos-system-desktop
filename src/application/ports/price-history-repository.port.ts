import { PriceHistory } from '../../domain/models/price-history.entity';

export interface IPriceHistoryRepository {
  save(entry: PriceHistory): Promise<void>;
  saveMany(entries: PriceHistory[]): Promise<void>;
  findByProductId(productId: string): Promise<PriceHistory[]>;
}

