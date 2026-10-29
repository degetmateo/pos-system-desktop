import React, { useEffect, useState } from 'react';
import { History, X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { ProductDto, PriceHistoryDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';

interface ProductPriceHistoryModalProps {
  isOpen: boolean;
  product: ProductDto | null;
  onClose: () => void;
}

export const ProductPriceHistoryModal: React.FC<ProductPriceHistoryModalProps> = ({
  isOpen,
  product,
  onClose,
}) => {
  const [history, setHistory] = useState<PriceHistoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !product) {
      setHistory([]);
      return;
    }
    setLoading(true);
    ApiClient.getPriceHistory(product.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="var(--brand-celeste)" /> Historial de Actualizaciones de Precios
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              Producto: <strong>{product.name}</strong>
            </p>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose}><X size={18} /></button>
        </div>

        {loading && <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando historial...</div>}

        {!loading && history.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
            <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>Sin historial de cambios registrado</p>
            <p style={{ fontSize: '0.8rem' }}>Las futuras modificaciones de precio quedarán guardadas automáticamente aquí.</p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Tipo</th>
                  <th>Precio Ant.</th>
                  <th>Precio Nuevo</th>
                  <th>Variación ($ / %)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const isPositive = h.difference >= 0;
                  const diffColor = isPositive ? '#16a34a' : '#dc2626';
                  const diffIcon = isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
                  const dateStr = new Date(h.createdAt).toLocaleString(undefined, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={h.id}>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{dateStr}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, background: h.priceType === 'major' ? '#eff6ff' : '#f0fdf4', color: h.priceType === 'major' ? '#1d4ed8' : '#15803d' }}>
                          {h.priceType === 'major' ? 'Mayorista' : 'Minorista'}
                        </span>
                      </td>
                      <td>${(h.oldPrice / 100).toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>${(h.newPrice / 100).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: diffColor }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {diffIcon}
                          <span>{isPositive ? '+' : ''}${(h.difference / 100).toFixed(2)} ({isPositive ? '+' : ''}{h.percentageDiff}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

