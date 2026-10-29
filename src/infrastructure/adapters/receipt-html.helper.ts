import { Order } from '../../domain/models/order.entity';

export class ReceiptHtmlHelper {
  public static generate(order: Order): string {
    const cust = order.customer;
    const clientDetails = [
      `<strong>Cliente:</strong> ${cust?.name || 'Consumidor Final'}`,
      cust?.cuil ? `CUIT/CUIL: ${cust.cuil}` : null,
      cust?.phone ? `Tel: ${cust.phone}` : null,
      cust?.email ? `Email: ${cust.email}` : null,
      cust?.address ? `Dirección: ${cust.address}` : null,
    ].filter(Boolean).join(' | ');

    const rows = order.getItems().map((item, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td><strong>${item.productName}</strong></td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${item.price.format()}</td>
        <td style="text-align:right">${item.discountPrice ? item.discountPrice.format() : '-'}</td>
        <td style="text-align:right"><strong>${item.getSubtotal().format()}</strong></td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Orden_${order.number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 24px; font-size: 13px; color: #1e293b; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #00c8f8; padding-bottom: 12px; margin-bottom: 14px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; }
    .sub { font-size: 12px; color: #64748b; }
    .client-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; font-weight: 700; }
    .total-box { margin-top: 14px; text-align: right; font-size: 13px; }
    .bank-box { margin-top: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #14532d; }
    .bank-title { font-weight: 800; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; }
    .disclaimer { font-size: 10px; color: #64748b; margin-top: 20px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">LIBRERÍA RUBÉN DARÍO</div>
      <div class="sub">CUIT: 30-71462441-1 (Responsable Inscripto)</div>
      <div class="sub">Medio de Pago: <strong>${order.paymentMethod?.getLabel() || 'Sin asignar'}</strong></div>
    </div>
    <div style="text-align:right">
      <div class="title">ORDEN N° ${order.number}</div>
      <div class="sub">Fecha: ${order.createdAt.toLocaleDateString()} ${order.createdAt.toLocaleTimeString()}</div>
      <div class="sub">Tipo de Venta: <strong>${order.type.isMajor() ? 'MAYORISTA' : 'MINORISTA'}</strong></div>
    </div>
  </div>

  <div class="client-box">
    ${clientDetails}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px; text-align:center">#</th>
        <th>Producto</th>
        <th style="width:50px; text-align:center">Cant.</th>
        <th style="width:90px; text-align:right">Precio U.</th>
        <th style="width:90px; text-align:right">Desc. Aplic.</th>
        <th style="width:100px; text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="total-box">
    <div>TOTAL: <strong style="font-size:16px; color:#0f172a">${order.getTotalPrice().format()}</strong></div>
    ${order.advancement.toDecimal() > 0 ? `<div>Adelanto / Seña: <strong style="color:#0369a1">${order.advancement.format()}</strong></div>` : ''}
    ${order.advancement.toDecimal() > 0 ? `<div>SALDO PENDIENTE: <strong style="color:#dc2626; font-size:15px">${order.getFinalDueAmount().format()}</strong></div>` : ''}
  </div>

  <div class="bank-box">
    <div class="bank-title">DATOS DE PAGO</div>
    <div><strong>TIPO DE CUENTA:</strong> Cuenta Corriente | <strong>BANCO:</strong> BANCO CREDICOOP</div>
    <div><strong>RAZÓN SOCIAL:</strong> RUBEN DARIO DEGET Y SERGIO EZEQUIEL DEGET SH | <strong>CUIT:</strong> 30714624411 (Responsable Inscripto)</div>
    <div><strong>ALIAS:</strong> OGRO.CASO.RUINA | <strong>CBU:</strong> 1910197455019700872596</div>
    <div><strong>DIRECCIÓN:</strong> MONTEVIDEO 1879, GRAL PACHECO</div>
  </div>

  <div class="disclaimer">
    Documento no válido como factura. Cotización válida por 5 días. Precios sujetos a cambios según disponibilidad de stock al momento de concretar la operación. En caso de solicitar factura A o B, enviar requisitos necesarios según reglamentación vigente ARCA.
  </div>
</body>
</html>`;
  }
}
