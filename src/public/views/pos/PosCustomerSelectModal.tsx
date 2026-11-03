import React, { useEffect, useState } from 'react';
import { Search, X, User, Check } from 'lucide-react';
import { CustomerDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';
import { Pagination } from '../../components/Pagination';

interface PosCustomerSelectModalProps {
  isOpen: boolean;
  selectedCustomerId: string;
  onSelectCustomer: (customer: CustomerDto | null) => void;
  onClose: () => void;
}

const PAGE_SIZE = 10;

export const PosCustomerSelectModal: React.FC<PosCustomerSelectModalProps> = ({
  isOpen, selectedCustomerId, onSelectCustomer, onClose,
}) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CustomerDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const timer = setTimeout(() => {
      ApiClient.getCustomersPaginated({
        search: query,
        page,
        limit: PAGE_SIZE,
        sorting: 'importance_desc',
      })
        .then((res) => {
          setItems(res.items);
          setTotalPages(res.totalPages);
          setTotalItems(res.total);
        })
        .catch(() => { setItems([]); setTotalPages(1); setTotalItems(0); })
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(timer);
  }, [isOpen, query, page]);

  if (!isOpen) return null;

  const renderTypePill = (type?: 'minor' | 'major' | null) => {
    if (!type) return <span style={{ fontSize: '0.73rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>Sin asignar</span>;
    const isMajor = type === 'major';
    return (
      <span style={{ fontSize: '0.73rem', padding: '2px 6px', borderRadius: '4px', background: isMajor ? '#eff6ff' : '#f0fdf4', color: isMajor ? '#1d4ed8' : '#15803d', fontWeight: 600 }}>
        {isMajor ? 'Mayorista' : 'Minorista'}
      </span>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="var(--brand-celeste)" /> Seleccionar Cliente
          </h3>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            autoFocus type="text" className="input" style={{ paddingLeft: '36px' }}
            placeholder="Buscar por nombre, agendado en WSP, teléfono, email o CUIT..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>

        <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button" className="btn btn-secondary"
            style={{ justifyContent: 'space-between', padding: '9px 14px', background: !selectedCustomerId ? '#e0f2fe' : '#fff', borderColor: !selectedCustomerId ? 'var(--brand-celeste)' : 'var(--border-color)' }}
            onClick={() => { onSelectCustomer(null); onClose(); }}
          >
            <span style={{ fontWeight: 700 }}>Consumidor Final</span>
            {!selectedCustomerId && <Check size={16} color="#0369a1" />}
          </button>

          {loading && items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Buscando clientes...</div>
          ) : items.map((c) => {
            const isSelected = c.id === selectedCustomerId;
            return (
              <button
                key={c.id} type="button" className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '9px 14px', background: isSelected ? '#e0f2fe' : '#fff', borderColor: isSelected ? 'var(--brand-celeste)' : 'var(--border-color)', textAlign: 'left' }}
                onClick={() => { onSelectCustomer(c); onClose(); }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name} {c.whatsappName ? <span style={{ fontWeight: 500, color: '#008069', fontSize: '0.8rem' }}>({c.whatsappName})</span> : null}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {c.cuil ? `CUIT: ${c.cuil}` : 'Sin CUIT'} {c.phone ? `| Tel: ${c.phone}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {renderTypePill(c.defaultOrderType)}
                  {isSelected && <Check size={16} color="#0369a1" />}
                </div>
              </button>
            );
          })}

          {!loading && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '22px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No se encontraron clientes con esa búsqueda.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} disabled={loading} />
        )}
      </div>
    </div>
  );
};
