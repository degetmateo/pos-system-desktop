module.exports = ReceiptTemplate = (order) => {
    let rows;

    if (order.type === 'major') {
        rows = order.items.map((item, number) => `
            <tr>
                <td class="text-left">${number + 1}</td>
                <td class="text-left">${item.product_name || 'Producto Eliminado'}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${(item.price / 100).toLocaleString()}</td>
                <td class="text-right">N/D</td>
                <td class="text-right">$${((item.price / 100) * item.quantity).toLocaleString()}</td>
            </tr>
        `);
    } else {
        rows = order.items.map((item, number) => {
            const index = order.discounts.findIndex(i => i.product_id === item.product.id);

            if (index < 0) {
                return `
                    <tr>
                        <td class="text-left">${number + 1}</td>
                        <td class="text-left">${item.product_name || 'Producto Eliminado'}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">$${(item.price / 100).toLocaleString()}</td>
                        <td class="text-right">N/D</td>
                        <td class="text-right">$${((item.price / 100) * item.quantity).toLocaleString()}</td>
                    </tr>
                `;
            } else {
                const discount = order.discounts[index];
                const subtotal = discount.discount_price * item.quantity;
                
                return `
                    <tr>
                        <td class="text-left">${number + 1}</td>
                        <td class="text-left">${item.product_name || 'Producto Eliminado'}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">$${(discount.original_price / 100).toLocaleString()}</td>
                        <td class="text-right">$${(discount.discount_price / 100).toLocaleString()}</td>
                        <td class="text-right">$${(subtotal / 100).toLocaleString()}</td>
                    </tr>
                `;
            };
        });
    };

    return `            
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    body {
                        margin: 1.5cm;

                        font-family: sans-serif; 
                        box-sizing: border-box;

                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }

                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        border-bottom: 1px solid #ddd;

                        padding-bottom: 20px;
                    }
                    
                    table {
                        width: 100%;
                        page-break-inside: auto;
                        break-inside: auto;
                        border-collapse: collapse;
                    }

                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        page-break-after: auto;
                    }

                    thead {
                        display: table-header-group;
                    }
                    
                    thead::before {
                        content: "";
                        display: block;
                        height: 1.5cm; 
                    }

                    th, td { 
                        border-bottom: 1px solid #ddd; 
                        padding: 8px;
                    }
                    
                    .text-left {
                        text-align: left;
                    }
                    
                    .text-right {
                        text-align: right;
                    }
                    
                    .text-center {
                        text-align: center;
                    }
                    
                    .total {
                        font-size: 20px; 
                        font-weight: bold; 
                        text-align: right;
                    }

                    .table-head {
                        border-bottom: 2px solid #000;
                    }
                    
                    .table-head-cell {
                        text-align: right;
                    }

                    .table-head-cell-name {
                        text-align: left;
                    }

                    .text-bold {
                        font-weight: bold;
                    }

                    .customer {
                        display: flex;
                        flex-direction:column;
                    }

                    .text-secondary {
                        font-size: 14px;
                        color: #b5b5b5;
                    }

                    .header-title {
                        font-size: 30px;
                        font-weight: bold;
                    }
                    
                    .detail-container {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;

                        align-items: flex-end;
                        justify-content: flex-start;

                        font-size: 20px;
                    }

                    tfoot {
                        display: table-footer-group;
                    }

                    .footer {
                        height: 1.5cm;
                        border: none !important;
                    }

                    @page {
                        margin: 0;
                        opacity: 0;
                        size: A4;
                    }

                    @media print {
                        body { 
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                </style>

                <title>check_${order.id}</title>
            </head>

            <body>
                <div class="header">
                    <span class="header-title">LIBRERIA RUBEN DARIO</span>
                    <div class="detail-container">
                        <span class="text-bold text-right">ORDEN DE VENTA N° ${order.number}</span>
                        <span class="text-right">Fecha: ${new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                <div class="customer">
                    <span class="text-secondary">CLIENTE</span>
                    <span class="text-bold">${order.customer ? order.customer.name || 'N/D' : 'N/D'}</span>
                    <span>CUIL/CUIT: ${order.customer ? order.customer.cuil || 'N/D' : 'N/D'}</span>
                    <span>EMAIL: ${order.customer ? order.customer.email || 'N/D' : 'N/D'}</span>
                </div>
            
                <table>
                    <thead class="table-head">
                        <tr>
                            <th class="table-head-cell">N°</th>
                            <th class="table-head-cell-name">Producto</th>
                            <th class="table-head-cell">Cantidad</th>
                            <th class="table-head-cell">Precio Unitario</th>
                            <th class="table-head-cell">Precio c/Descuento</th>
                            <th class="table-head-cell">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" class="footer"></td>
                        </tr>
                    </tfoot>
                        
                </table>
                
                <div class="total">
                    Total: $${(order.total_price / 100).toLocaleString()}
                </div>

                ${order.discounts.length > 0 ? `<p>* Esta orden incluye descuentos aplicados.</p>` : ''}

                <p class="text-center"><b>Documento no válido como factura.</b> Cotización válida por 5 días. Precios sujetos a cambios según disponibilidad de stock al momento de concretar la operación.</p>

                <p class="text-center">En caso de solicitar factura A o B, enviar requisitos necesarios según reglamentación vigente ARCA.</p>
            </body>
        </html>
    `;
};