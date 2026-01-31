module.exports = ReceiptTemplate = (order) => {
    let rows;

    if (order.type === 'major') {
        rows = order.items.map(item => `
            <tr>
                <td class="text-left">${item.product.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${(item.price / 100).toLocaleString()}</td>
                <td class="text-right">N/D</td>
                <td class="text-right">$${((item.price / 100) * item.quantity).toLocaleString()}</td>
            </tr>
        `).join('');
    } else {
        rows = order.items.map(item => {
            const index = order.discounts.findIndex(i => i.product_id === item.product.id);

            if (index < 0) {
                return `
                    <tr>
                        <td class="text-left">${item.product.name}</td>
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
                        <td class="text-left">${item.product.name}</td>
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
                        font-family: sans-serif; 
                        padding: 20px; 
                    }

                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 20px;
                        border-bottom: 1px solid #ddd;
                    }
                    
                    table { 
                        width: 100%; 
                        border-collapse: collapse;
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
                        margin-top: 20px; 
                        text-align: right;
                    }

                    .table-head {
                        border-bottom: 2px solid #000;
                    }
                    
                    .table-head-cell {
                        // display: flex;
                        // align-items: center;
                        // justify-content: flex-end;
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
                        margin-bottom: 20px;
                    }

                    .text-secondary {
                        font-size: 14px;
                        color: #b5b5b5;
                    }
                    @page {
                        margin: 0; /* Esto elimina la fecha, la URL y el título de la hoja */
                        size: auto; /* Ajusta al tamaño de papel seleccionado */
                    }
                    @media print {
                        body { 
                            margin: 1.5cm; 
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                        
                        table, tr, td {
                            page-break-inside: avoid; 
                            break-inside: avoid;
                        }

                        thead {
                            display: table-header-group; 
                        }
                        
                        .total-section {
                            page-break-inside: avoid;
                        }
                    }
                </style>

                <title>check_${order.id}</title>
            </head>

            <body>
                <div class="header">
                    <h2>LIBRERIA RUBEN DARIO</h2>
                    <div>
                        <p class="text-bold text-right">ORDEN DE VENTA N° ${order.number}</p>
                        <p class="text-right">Fecha: ${new Date(order.created_at).toLocaleDateString()}</p>
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
                            <th class="table-head-cell-name">Producto</th>
                            <th class="table-head-cell">Cantidad</th>
                            <th class="table-head-cell">Precio Unitario</th>
                            <th class="table-head-cell">Precio c/Descuento</th>
                            <th class="table-head-cell">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="total">
                    Total: $${(order.total_price / 100).toLocaleString()}
                </div>

                ${order.discounts.length > 0 ? `<p>NOTA: Esta orden incluye descuentos aplicados.</p>` : ''}

                <p><b>AVISO IMPORTANTE: Documento no válido como factura.</b> Cotización válida por 5 días. Precios sujetos a cambios según disponibilidad de stock al momento de concretar la operación.</p>
            </body>
        </html>
    `;
};