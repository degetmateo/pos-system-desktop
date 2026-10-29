import React, { useState } from 'react';
import { Search, X, User, Check } from 'lucide-react';
import { CustomerDto } from '../../types/api.types';

interface PosCustomerSelectModalProps {
  isOpen: boolean;
  selectedCustomerId: string;
  customers: CustomerDto[];
  onSelectCustomer: (id: string, defaultType?: 'minor' | 'major' | null) => void;
  onClose: () => void;
}

export const PosCustomerSelectModal: React.FC<PosCustomerSelectModalProps> = ({
  isOpen,
  selectedCustomerId,
  customers,
  onSelectCustomer,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.cuil && c.cuil.includes(q)) || (c.phone && c.phone.includes(q));
  });

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="var(--brand-celeste)" /> Seleccionar Cliente
          </h3>
          <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            autoFocus
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Buscar por nombre, CUIT o teléfono..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: 'space-between', padding: '10px 14px', background: !selectedCustomerId ? '#e0f2fe' : '#fff', borderColor: !selectedCustomerId ? 'var(--brand-celeste)' : 'var(--border-color)' }}
            onClick={() => { onSelectCustomer('', 'minor'); onClose(); }}
          >
            <span style={{ fontWeight: 700 }}>Consumidor Final</span>
            {!selectedCustomerId && <Check size={16} color="#0369a1" />}
          </button>

          {filtered.map((c) => {
            const isSelected = c.id === selectedCustomerId;
            return (
              <button
                key={c.id}
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '10px 14px', background: isSelected ? '#e0f2fe' : '#fff', borderColor: isSelected ? 'var(--brand-celeste)' : 'var(--border-color)', textAlign: 'left' }}
                onClick={() => { onSelectCustomer(c.id, c.defaultOrderType); onClose(); }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {c.cuil ? `CUIT: ${c.cuil}` : 'Sin CUIT'} {c.phone ? `| Tel: ${c.phone}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: c.defaultOrderType === 'major' ? '#eff6ff' : '#f0fdf4', color: c.defaultOrderType === 'major' ? '#1d4ed8' : '#15803d', fontWeight: 600 }}>
                    {c.defaultOrderType === 'major' ? 'Mayorista' : 'Minorista'}
                  </span>
                  {isSelected && <Check size={16} color="#0369a1" />}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No se encontraron clientes con esa búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

