import ExcelJS from 'exceljs';
import { Product } from '../../domain/models/product.entity';
import { Provider } from '../../domain/models/provider.entity';
import { IProductRepository } from '../ports/product-repository.port';
import { IProviderRepository } from '../ports/provider-repository.port';

export interface BulkProductJsonItem {
  id: string;
  name: string;
  description: string | null;
  barcode: string | null;
  retailPrice: number | null;
  wholesalePrice: number | null;
  retailPriceTiers?: Array<{ minQuantity: number; unitPrice: number }>;
  supplier: string | null;
  categories: string[];
  tags: string[];
  isActive: boolean;
}

/**
 * Servicio de Exportación Masiva de Productos (PEAA Service Layer + GoF Builder).
 * Genera archivos compatibles con la especificación BULK_PRODUCT_IMPORT_SPEC.md (JSON y Excel).
 */
export class BulkProductExportService {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly providerRepo: IProviderRepository
  ) {}

  public async exportToJson(): Promise<BulkProductJsonItem[]> {
    const products: Product[] = await this.productRepo.findAll();
    const providers: Provider[] = await this.providerRepo.findAll();
    const providerMap = new Map<string, string>(providers.map((p) => [p.id, p.name]));

    return products.map((p: Product): BulkProductJsonItem => {
      const tiers = (p.minorPrices || [])
        .map((mp) => ({
          minQuantity: mp.conditionValue,
          unitPrice: Math.round(mp.priceValue.getCents() / 100),
        }))
        .sort((a, b) => a.minQuantity - b.minQuantity);

      return {
        id: p.id,
        name: p.name,
        description: p.description || null,
        barcode: p.barcode?.getValue() || null,
        retailPrice: Math.round(p.priceMinor.getCents() / 100),
        wholesalePrice: Math.round(p.priceMajor.getCents() / 100),
        ...(tiers.length > 0 ? { retailPriceTiers: tiers } : {}),
        supplier: p.providerId ? (providerMap.get(p.providerId) || null) : null,
        categories: [] as string[],
        tags: [] as string[],
        isActive: !p.deleted,
      };
    });
  }

  public async exportToExcel(): Promise<Buffer> {
    const jsonItems = await this.exportToJson();
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Productos');

    sheet.columns = [
      { header: 'ID (Opcional)', key: 'id', width: 38 },
      { header: 'Nombre *', key: 'name', width: 32 },
      { header: 'Código de Barras', key: 'barcode', width: 18 },
      { header: 'Precio Minorista', key: 'retailPrice', width: 16 },
      { header: 'Precio Mayorista', key: 'wholesalePrice', width: 16 },
      { header: 'Proveedor', key: 'supplier', width: 22 },
      { header: 'Categorías (coma)', key: 'categories', width: 20 },
      { header: 'Etiquetas (coma)', key: 'tags', width: 20 },
      { header: 'Activo (SI/NO)', key: 'isActive', width: 14 },
      { header: 'Descripción', key: 'description', width: 35 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const item of jsonItems) {
      sheet.addRow({
        id: item.id,
        name: item.name,
        barcode: item.barcode || '',
        retailPrice: item.retailPrice ?? 0,
        wholesalePrice: item.wholesalePrice ?? 0,
        supplier: item.supplier || '',
        categories: item.categories.join(', '),
        tags: item.tags.join(', '),
        isActive: item.isActive ? 'SI' : 'NO',
        description: item.description || '',
      });
    }

    return Buffer.from(await book.xlsx.writeBuffer());
  }
}
