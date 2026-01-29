const path = require('path');
const Printer = require('pdfmake');

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../shared/fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../shared/fonts/Roboto-Bold.ttf'),
        italics: path.join(__dirname, '../../shared/fonts/Roboto-Italic.ttf')
    }
};

class PDFCreator {
    constructor () {
        this.printer = new Printer(fonts);
    };

    receipt (order) {
        const tableBody = [
            [
                { text: 'Producto', style: 'tableHeader' },
                { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
                { text: 'Precio Unit.', style: 'tableHeader', alignment: 'right' },
                { text: 'Subtotal', style: 'tableHeader', alignment: 'right' }
            ]
        ];

        order.items.forEach(item => {
            const precio = order.type === 'major' ? item.product.price_major : item.product.price_minor;
            const subtotal = precio * item.quantity;

            tableBody.push([
                item.product.name,
                { text: item.quantity.toString(), alignment: 'center' },
                { text: `$${(precio / 100).toLocaleString()}`, alignment: 'right' },
                { text: `$${(subtotal / 100).toLocaleString()}`, alignment: 'right' }
            ]);
        });

        const definition = {
            content: [
                {
                    columns: [
                        { text: 'LIBRERIA RUBEN DARIO', style: 'brand' },
                        { text: `ORDEN DE VENTA N° ${order.number}`, alignment: 'right', style: 'orderTitle' }
                    ]
                },
                { text: `Fecha: ${new Date(order.created_at).toLocaleDateString()}`, alignment: 'right', margin: [0, 0, 0, 20] },

                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#eeeeee' }] },

                // Información del Cliente
                {
                    margin: [0, 20, 0, 20],
                    columns: [
                        {
                            text: [
                                { text: 'CLIENTE:\n', style: 'subheader' },
                                { text: `${order.customer ? order.customer.name : 'N/D'}\n`, bold: true },
                                { text: `CUIL/CUIT: ${order.customer ? order.customer.cuil : 'N/D'}\n` },
                                { text: `EMAIL: ${order.customer ? order.customer.email : 'N/D'}` }
                            ]
                        },
                        {
                            text: [
                                { text: 'ESTADO:\n', style: 'subheader' },
                                { text: order.status, color: order.status === 'PENDING' ? 'orange' : 'green', bold: true }
                            ],
                            alignment: 'right'
                        }
                    ]
                },

                // Tabla de Items
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: 'lightHorizontalLines'
                },

                // SECCIÓN DE DESCUENTOS (Condicional)
                // Si hay descuentos, se agrega un bloque de texto informativo
                ...(order.discounts && order.discounts.length > 0 ? [
                    {
                        margin: [0, 15, 0, 0],
                        text: [
                            { text: 'Nota: ', bold: true, color: '#c0392b' },
                            { text: 'Esta orden incluye descuentos aplicados en los precios unitarios.', italics: true, color: '#444' }
                        ]
                    }
                ] : []),

                // Total Corregido
                {
                    margin: [0, 10, 0, 0],
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [
                                '', 
                                {
                                    // Esta sub-tabla interna asegura que el texto y el monto estén pegados y alineados
                                    table: {
                                        body: [
                                            [
                                                { text: 'TOTAL:', style: 'totalLabel', margin: [0, 5, 10, 0] },
                                                { text: `$${(order.total_price / 100).toLocaleString()}`, style: 'totalAmount' }
                                            ]
                                        ]
                                    },
                                    layout: 'noBorders'
                                }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                }
            ],
            styles: {
                brand: { fontSize: 18, bold: true, color: '#2c3e50' },
                orderTitle: { fontSize: 14, bold: true },
                subheader: { fontSize: 10, color: 'gray', marginBottom: 4 },
                tableHeader: { bold: true, fontSize: 11, color: 'black', margin: [0, 5, 0, 5] },
                totalLabel: { fontSize: 14, bold: true },
                totalAmount: { fontSize: 18, bold: true, color: '#27ae60' }
            }
        };
        const doc = this.printer.createPdfKitDocument(definition);
        return doc;
    };
};

module.exports = new PDFCreator();