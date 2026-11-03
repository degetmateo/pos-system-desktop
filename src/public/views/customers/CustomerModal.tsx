import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomerDto, CustomerImportanceCode } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';
import { ToastService } from '../../services/toast.service';

interface CustomerModalProps {
  isOpen: boolean;
  customer: CustomerDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, customer, onClose, onSaved }) => {
  const [data, setData] = useState<Partial<CustomerDto>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(customer
      ? { ...customer }
      : { name: '', whatsappName: '', cuil: '', email: '', phone: '', address: '', defaultOrderType: null, importance: 'normal' }
    );
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        whatsappName: data.whatsappName || null,
        cuil: data.cuil || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        type: data.defaultOrderType || null,
        importance: data.importance || 'normal',
      };
      if (customer?.id) await ApiClient.updateCustomer(customer.id, payload);
      else await ApiClient.createCustomer(payload);
      ToastService.success('Cliente guardado.');
      onSaved();
      onClose();
    } catch (e: any) { ToastService.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Razón Social / Nombre *</label>
              <input required type="text" className="input" value={data.name || ''} onChange={(e) => setData({ ...data, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre agendado en WhatsApp</label>
              <input type="text" className="input" placeholder="Ej: Mateo Kiosco" value={data.whatsappName || ''} onChange={(e) => setData({ ...data, whatsappName: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>CUIT / CUIL</label>
              <input type="text" className="input" value={data.cuil || ''} onChange={(e) => setData({ ...data, cuil: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tipo de Venta</label>
              <select className="select" value={data.defaultOrderType || ''} onChange={(e) => setData({ ...data, defaultOrderType: (e.target.value || null) as any })}>
                <option value="">Sin asignar</option>
                <option value="minor">Minorista</option>
                <option value="major">Mayorista</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Importancia</label>
              <select className="select" value={data.importance || 'normal'} onChange={(e) => setData({ ...data, importance: e.target.value as CustomerImportanceCode })}>
                <option value="important">Importante</option>
                <option value="normal">Normal</option>
                <option value="low">Poca importancia</option>
                <option value="ignore">Ignorar</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Teléfono / WhatsApp</label>
              <input type="text" className="input" value={data.phone || ''} onChange={(e) => setData({ ...data, phone: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Correo Electrónico</label>
              <input type="email" className="input" value={data.email || ''} onChange={(e) => setData({ ...data, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dirección</label>
            <input type="text" className="input" value={data.address || ''} onChange={(e) => setData({ ...data, address: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
