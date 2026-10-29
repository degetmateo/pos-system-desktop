import { Order } from '../../domain/models/order.entity';
import { IPdfGeneratorPort } from '../../application/ports/pdf-generator.port';
import { ReceiptHtmlHelper } from './receipt-html.helper';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake');
const vfs = require('pdfmake/build/vfs_fonts.js');
const printer = new PdfPrinter({
  Roboto: {
    normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
  },
});

export class PdfMakeAdapter implements IPdfGeneratorPort {
  public generateReceiptHtml(order: Order): string {
    return ReceiptHtmlHelper.generate(order);
  }

  public async generateReceiptPdf(order: Order): Promise<Buffer> {
    const cust = order.customer;
    const clientInfo = [
      `Cliente: ${cust?.name || 'Consumidor Final'}`,
      cust?.cuil ? `CUIT: ${cust.cuil}` : null,
      cust?.phone ? `Tel: ${cust.phone}` : null,
      cust?.address ? `Dir: ${cust.address}` : null,
    ].filter(Boolean).join('  |  ');

    const tableRows = [
      [
        { text: '#', bold: true, alignment: 'center' },
        { text: 'Producto', bold: true },
        { text: 'Cant.', bold: true, alignment: 'center' },
        { text: 'Precio U.', bold: true, alignment: 'right' },
        { text: 'Desc.', bold: true, alignment: 'right' },
        { text: 'Subtotal', bold: true, alignment: 'right' },
      ],
      ...order.getItems().map((item, idx) => [
        { text: String(idx + 1), alignment: 'center' },
        { text: item.productName },
        { text: String(item.quantity), alignment: 'center' },
        { text: item.price.format(), alignment: 'right' },
        { text: item.discountPrice ? item.discountPrice.format() : '-', alignment: 'right' },
        { text: item.getSubtotal().format(), alignment: 'right', bold: true },
      ]),
    ];

    const docDef: any = {
      pageSize: 'A4',
      pageMargins: [28, 28, 28, 28],
      content: [
        {
          columns: [
            { text: [{ text: 'LIBRERÍA RUBÉN DARÍO\n', fontSize: 16, bold: true }, { text: 'CUIT: 30-71462441-1 (Resp. Inscripto)\nPago: ' + (order.paymentMethod?.getLabel() || 'Sin asignar'), fontSize: 9, color: '#475569' }] },
            { text: [{ text: `ORDEN N° ${order.number}\n`, fontSize: 15, bold: true }, { text: `Fecha: ${order.createdAt.toLocaleDateString()} ${order.createdAt.toLocaleTimeString()}\nTipo: ${order.type.isMajor() ? 'MAYORISTA' : 'MINORISTA'}`, fontSize: 9, color: '#475569' }], alignment: 'right' },
          ],
          marginBottom: 10,
        },
        { text: clientInfo, fontSize: 9, background: '#f8fafc', margin: [0, 0, 0, 10] },
        { table: { headerRows: 1, widths: [20, '*', 35, 65, 55, 70], body: tableRows }, fontSize: 9, marginBottom: 10 },
        {
          text: [
            { text: `TOTAL: ${order.getTotalPrice().format()}\n`, bold: true, fontSize: 13 },
            order.advancement.toDecimal() > 0 ? { text: `Adelanto: ${order.advancement.format()}  |  SALDO PENDIENTE: ${order.getFinalDueAmount().format()}\n`, color: '#0369a1', fontSize: 10, bold: true } : '',
          ],
          alignment: 'right',
          marginBottom: 12,
        },
        {
          table: {
            widths: ['*'],
            body: [[{
              fillColor: '#f0fdf4',
              fontSize: 8,
              text: 'DATOS DE PAGO\nTIPO DE CUENTA: Cuenta Corriente | BANCO: BANCO CREDICOOP\nRAZÓN SOCIAL: RUBEN DARIO DEGET Y SERGIO EZEQUIEL DEGET SH | CUIT: 30714624411 (Responsable Inscripto)\nALIAS: OGRO.CASO.RUINA | CBU: 1910197455019700872596\nDIRECCIÓN: MONTEVIDEO 1879, GRAL PACHECO',
            }]],
          },
          marginBottom: 10,
        },
        {
          text: 'Documento no válido como factura. Cotización válida por 5 días. Precios sujetos a cambios según disponibilidad de stock al momento de concretar la operación. En caso de solicitar factura A o B, enviar requisitos necesarios según reglamentación vigente ARCA.',
          fontSize: 7.5,
          color: '#64748b',
          alignment: 'center',
        },
      ],
    };

    return new Promise((resolve, reject) => {
      const doc = printer.createPdfKitDocument(docDef);
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
