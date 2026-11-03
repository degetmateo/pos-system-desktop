import React, { useEffect, useState } from 'react';
import { X, Phone, UserCheck, Search } from 'lucide-react';
import { ApiClient } from '../../services/api.client';
import { ToastService } from '../../services/toast.service';
import { CustomerDto } from '../../types/api.types';
import { Pagination } from '../../components/Pagination';

interface WhatsappNewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (phone: string, name?: string) => Promise<void>;
}

export const WhatsappNewChatModal: React.FC<WhatsappNewChatModalProps> = ({
  isOpen, onClose, onStartChat,
}) => {
  const [phone, setPhone] = useState('549');
  const [name, setName] = useState('');
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingList(true);
    const timer = setTimeout(() => {
      ApiClient.getCustomersPaginated({ search: customerQuery, has_phone: 'true', page, limit: 8, sorting: 'importance_desc' })
        .then((res) => { setCustomers(res.items); setTotalPages(res.totalPages); setTotalItems(res.total); })
        .catch(() => { setCustomers([]); setTotalPages(1); setTotalItems(0); })
        .finally(() => setLoadingList(false));
    }, 180);
    return () => clearTimeout(timer);
  }, [isOpen, customerQuery, page]);

  if (!isOpen) return null;

  const openChatSafe = async (targetPhone: string, targetName?: string) => {
    setSubmitting(true);
    try {
      await onStartChat(targetPhone, targetName);
      onClose();
    } catch (err: any) {
      ToastService.error(err.message || 'No se pudo iniciar la conversación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Iniciar Nuevo Chat de WhatsApp</h3>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); void openChatSafe(phone, name || undefined); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}
        >
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Número de teléfono (ej. 5491122334455 o 1122334455)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="54911..." required />
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (opcional)" />
          </div>
          <button type="submit" className="btn wa-btn-green" disabled={submitting}>
            <Phone size={15} /> Abrir Conversación
          </button>
        </form>

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
            O seleccionar cliente con teléfono agendado:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Search size={15} color="#64748b" />
            <input
              className="input" placeholder="Buscar cliente por nombre, WSP o teléfono..."
              value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ maxHeight: '210px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {customers.map((c) => (
              <button
                key={c.id} type="button" className="btn btn-secondary" disabled={submitting}
                style={{ justifyContent: 'space-between', width: '100%' }}
                onClick={() => void openChatSafe(c.phone || '', c.name)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <UserCheck size={15} color="#00a884" /> {c.name}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>{c.phone}</span>
              </button>
            ))}
            {!loadingList && customers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>Sin clientes con teléfono para esta búsqueda.</div>
            )}
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} disabled={loadingList} />}
        </div>
      </div>
    </div>
  );
};
