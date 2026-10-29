import React, { useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { ProductDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';

interface PosProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ProductDto) => void;
}

export const PosProductSearchModal: React.FC<PosProductSearchModalProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const handler = setTimeout(() => {
      ApiClient.getProducts({ name: query, limit: 20 })
        .then((res) => setProducts(res))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handler);
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Buscar Producto</h3>
          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            autoFocus
            type="text"
            className="input"
            style={{ paddingLeft: '38px' }}
            placeholder="Buscar por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading && <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Buscando...</p>}
          {!loading && products.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No se encontraron productos.</p>
          )}
          {products.map((p) => {
            const minor = typeof p.priceMinor === 'object' && p.priceMinor !== null ? (p.priceMinor as any).cents : (p.priceMinor || 0);
            const major = typeof p.priceMajor === 'object' && p.priceMajor !== null ? (p.priceMajor as any).cents : (p.priceMajor || 0);
            return (
              <div
                key={p.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#fff', gap: '10px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Min: ${(minor / 100).toFixed(2)} | May: ${(major / 100).toFixed(2)} | Stock: {p.stock}
                  </div>
                </div>
                <button className="btn btn-primary" style={{ padding: '6px 12px', flexShrink: 0 }} onClick={() => { onSelectProduct(p); onClose(); }}>
                  <Plus size={16} /> Agregar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

