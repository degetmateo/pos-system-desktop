const payments = require("../static/payments");
const receiptStyle = require("./styles/receipt.style");

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
                ${receiptStyle()}
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

                <div class="header-details-container">
                    <div class="customer">
                        <span class="text-secondary">CLIENTE</span>
                        <span class="text-bold">${order.customer ? order.customer.name || 'N/D' : 'N/D'}</span>
                        <span>CUIL/CUIT: ${order.customer ? order.customer.cuil || 'N/D' : 'N/D'}</span>
                        <span>EMAIL: ${order.customer ? order.customer.email || 'N/D' : 'N/D'}</span>
                        <span>MÉTODO DE PAGO: <b>${order.payment_method ? payments[order.payment_method] : 'SIN ASIGNAR'}</b></span>
                    </div>

                    <div class="payment-data-container">
                        <span class="text-secondary">DATOS DE PAGO</span>
                        <span><b>RUBEN DARIO DEGET Y SERGIO EZEQUIEL DEGET SH</b></span>
                        <span><b>30714624411</b> (Responsable Inscripto)</span>
                        <span><b>OGRO.CASO.RUINA</b></span>
                        <span><b>1910197455019700872596</b></span>
                    </div>
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
                
                <div class="total-container">
                    <div class="total">
                        <span>TOTAL: $${(order.total_price / 100).toLocaleString()}</span>
                        <span>ADELANTO: $${(order.advancement / 100).toLocaleString()}</span>
                        <span>PAGO FINAL: $${((order.total_price - order.advancement) / 100).toLocaleString()}</span>
                    </div>
                    ${order.discounts.length > 0 ? `<p>Esta orden incluye descuentos aplicados.</p>` : ''}
                </div>


                <p class="text-center disclaimer"><b>Documento no válido como factura.</b> Cotización válida por 5 días. Precios sujetos a cambios según disponibilidad de stock al momento de concretar la operación. En caso de solicitar factura A o B, enviar requisitos necesarios según reglamentación vigente ARCA.</p>

            </body>
        </html>
    `;
};