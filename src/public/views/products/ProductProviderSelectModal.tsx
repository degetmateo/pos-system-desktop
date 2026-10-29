import React, { useState } from 'react';
import { Search, X, Plus, Building2, Check } from 'lucide-react';
import { ProviderDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';
import { ToastService } from '../../services/toast.service';

interface Props {
  isOpen: boolean; selectedProviderId: string | null; providers: ProviderDto[];
  onSelectProvider: (id: string | null) => void; onProviderCreated: (provider: ProviderDto) => void; onClose: () => void;
}

export const ProductProviderSelectModal: React.FC<Props> = ({
  isOpen, selectedProviderId, providers, onSelectProvider, onProviderCreated, onClose,
}) => {
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const filtered = providers.filter((p) => p.name.toLowerCase().includes(query.toLowerCase().trim()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await ApiClient.createProvider({ name: newName.trim(), barcode_prefix: newPrefix.trim() || undefined });
      ToastService.success(`Proveedor "${created.name}" agregado.`);
      onProviderCreated(created);
      onSelectProvider(created.id);
      setNewName(''); setNewPrefix(''); setShowCreate(false); onClose();
    } catch (err: any) { ToastService.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="var(--brand-celeste)" /> Seleccionar Proveedor
          </h3>
          <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
        </div>

        {showCreate ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Nuevo Proveedor</div>
            <input autoFocus required type="text" className="input" placeholder="Nombre de la empresa / proveedor *" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input type="text" className="input" placeholder="Prefijo de código de barras (opcional)" value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear Proveedor'}</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input autoFocus type="text" className="input" style={{ paddingLeft: '32px' }} placeholder="Buscar proveedor..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap', padding: '8px 12px' }}><Plus size={16} /> Nuevo</button>
          </div>
        )}

        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: 'space-between', padding: '8px 12px', background: !selectedProviderId ? '#e0f2fe' : '#fff' }}
            onClick={() => { onSelectProvider(null); onClose(); }}
          >
            <span>Sin Asignar</span>
            {!selectedProviderId && <Check size={16} color="#0369a1" />}
          </button>
          {filtered.map((p) => {
            const isSel = p.id === selectedProviderId;
            return (
              <button
                key={p.id}
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '8px 12px', background: isSel ? '#e0f2fe' : '#fff', textAlign: 'left' }}
                onClick={() => { onSelectProvider(p.id); onClose(); }}
              >
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                {isSel && <Check size={16} color="#0369a1" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
