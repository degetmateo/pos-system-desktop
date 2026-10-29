import ExcelJS from 'exceljs';
import { Product } from '../../domain/models/product.entity';
import { IExcelGeneratorPort, ParsedExcelProduct } from '../../application/ports/excel-generator.port';

export class ExceljsAdapter implements IExcelGeneratorPort {
  public async createInternalBook(products: Product[]): Promise<Buffer> {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('reporte');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 36 }, { header: 'CÓDIGO', key: 'barcode', width: 14 },
      { header: 'NOMBRE', key: 'name', width: 28 }, { header: 'PROVEEDOR', key: 'provider', width: 20 },
      { header: 'P. MAYOR.', key: 'major_price', width: 14 }, { header: 'P. MINOR.', key: 'minor_price', width: 14 },
      { header: 'COND. DESC. 1', key: 'cond_1', width: 14 }, { header: 'PRECIO DESC. 1', key: 'price_1', width: 14 },
      { header: 'COND. DESC. 2', key: 'cond_2', width: 14 }, { header: 'PRECIO DESC. 2', key: 'price_2', width: 14 },
      { header: 'COND. DESC. 3', key: 'cond_3', width: 14 }, { header: 'PRECIO DESC. 3', key: 'price_3', width: 14 },
      { header: 'COND. DESC. 4', key: 'cond_4', width: 14 }, { header: 'PRECIO DESC. 4', key: 'price_4', width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const p of products) {
      const d = p.minorPrices;
      sheet.addRow({
        id: p.id, barcode: p.barcode?.getValue() || '', name: p.name, provider: p.providerId || 'SIN ASIGNAR',
        major_price: p.priceMajor.toDecimal(), minor_price: p.priceMinor.toDecimal(),
        cond_1: d[0]?.conditionValue || 0, price_1: d[0] ? d[0].priceValue.toDecimal() : 0,
        cond_2: d[1]?.conditionValue || 0, price_2: d[1] ? d[1].priceValue.toDecimal() : 0,
        cond_3: d[2]?.conditionValue || 0, price_3: d[2] ? d[2].priceValue.toDecimal() : 0,
        cond_4: d[3]?.conditionValue || 0, price_4: d[3] ? d[3].priceValue.toDecimal() : 0,
      });
    }
    return Buffer.from(await book.xlsx.writeBuffer());
  }

  public async createCustomerBook(products: Product[]): Promise<Buffer> {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Lista de Precios');
    sheet.columns = [
      { header: 'CÓDIGO', key: 'barcode', width: 16 }, { header: 'NOMBRE', key: 'name', width: 35 },
      { header: 'P. MAYOR.', key: 'price_major', width: 14 }, { header: 'P. MINOR.', key: 'price_minor', width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const p of products) {
      sheet.addRow({
        barcode: p.barcode?.getValue() || '', name: p.name,
        price_major: p.priceMajor.toDecimal(), price_minor: p.priceMinor.toDecimal(),
      });
    }
    return Buffer.from(await book.xlsx.writeBuffer());
  }

  public async parseInternalBook(buffer: Buffer): Promise<ParsedExcelProduct[]> {
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(buffer as any);
    const sheet = book.getWorksheet(1);
    const result: ParsedExcelProduct[] = [];
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const id = String(row.getCell(1).value || '').trim();
      const name = String(row.getCell(3).value || '').trim();
      if (!id || !name) return;
      const hasProv = isNaN(Number(row.getCell(4).value)) || typeof row.getCell(4).value === 'string';
      const o = hasProv ? 1 : 0;
      result.push({
        id, barcode: String(row.getCell(2).value || '').trim() || null, name,
        price_major: Number(row.getCell(4 + o).value) || 0, price_minor: Number(row.getCell(5 + o).value) || 0,
        discount_cond_1: Number(row.getCell(6 + o).value) || 0, discount_price_1: Number(row.getCell(7 + o).value) || 0,
        discount_cond_2: Number(row.getCell(8 + o).value) || 0, discount_price_2: Number(row.getCell(9 + o).value) || 0,
        discount_cond_3: Number(row.getCell(10 + o).value) || 0, discount_price_3: Number(row.getCell(11 + o).value) || 0,
        discount_cond_4: Number(row.getCell(12 + o).value) || 0, discount_price_4: Number(row.getCell(13 + o).value) || 0,
      });
    });
    return result;
  }
}
