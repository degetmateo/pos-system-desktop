import React, { useState } from 'react';
import { CheckCircle2, Printer, Download, Camera, Copy, X } from 'lucide-react';
import { ApiClient } from '../../services/api.client';
import { OrderCaptureService } from '../../services/order-capture.service';
import { OrderDto } from '../../types/api.types';

interface PosReceiptModalProps {
  orderId: string | null;
  orderNumber: number | null;
  orderData?: OrderDto | null;
  onClose: () => void;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({ orderId, orderNumber, orderData, onClose }) => {
  const [copyingImg, setCopyingImg] = useState(false);
  const [copyingPdf, setCopyingPdf] = useState(false);

  if (!orderId) return null;

  const printUrl = `/api/orders/receipt/${orderId}?action=print`;
  const saveUrl = `/api/orders/receipt/${orderId}?action=save`;

  const handleCopyCapture = async () => {
    setCopyingImg(true);
    try {
      const order = orderData || (await ApiClient.getOrderById(orderId));
      await OrderCaptureService.copyOrderCapture(order, orderNumber);
    } catch (e: any) {
      console.error(e);
    } finally {
      setCopyingImg(false);
    }
  };

  const handleCopyPdf = async () => {
    setCopyingPdf(true);
    try {
      await OrderCaptureService.copyOrderPdf(orderId, orderNumber);
    } finally {
      setCopyingPdf(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '50%', color: '#16a34a' }}>
            <CheckCircle2 size={48} />
          </div>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
          ¡Venta Registrada con Éxito!
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Comprobante <b>N° {orderNumber || ''}</b> generado correctamente.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}
              disabled={copyingImg}
              onClick={handleCopyCapture}
              title="Copiar imagen de la tabla al portapapeles"
            >
              <Camera size={16} /> {copyingImg ? 'Copiando...' : 'Copiar Imagen'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '10px', fontSize: '0.9rem', justifyContent: 'center', background: '#0284c7' }}
              disabled={copyingPdf}
              onClick={handleCopyPdf}
              title="Copiar el archivo PDF al portapapeles para pegar con Ctrl + V"
            >
              <Copy size={16} /> {copyingPdf ? 'Copiando...' : 'Copiar PDF'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <a href={printUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}>
              <Printer size={16} /> Imprimir
            </a>
            <a href={saveUrl} download className="btn btn-secondary" style={{ padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}>
              <Download size={16} /> Descargar PDF
            </a>
          </div>

          <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={onClose}>
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
};
