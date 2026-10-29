import React from 'react';
import { CheckCircle2, Printer, Download, X } from 'lucide-react';

interface PosReceiptModalProps {
  orderId: string | null;
  orderNumber: number | null;
  onClose: () => void;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({ orderId, orderNumber, onClose }) => {
  if (!orderId) return null;

  const printUrl = `/api/orders/receipt/${orderId}?action=print`;
  const saveUrl = `/api/orders/receipt/${orderId}?action=save`;

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href={printUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '12px', fontSize: '1rem' }}>
            <Printer size={18} /> Imprimir Comprobante
          </a>
          <a href={saveUrl} download className="btn btn-secondary" style={{ padding: '12px', fontSize: '1rem' }}>
            <Download size={18} /> Descargar PDF
          </a>
          <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={onClose}>
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
};

