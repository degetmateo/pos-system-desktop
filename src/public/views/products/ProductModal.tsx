import React, { useState, useEffect } from 'react';
import { X, Wand2, ChevronDown } from 'lucide-react';
import { ProductDto, ProviderDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';
import { ToastService } from '../../services/toast.service';
import { ProductDiscountsSubForm } from './ProductDiscountsSubForm';
import { ProductProviderSelectModal } from './ProductProviderSelectModal';

interface Props {
  isOpen: boolean; product: ProductDto | null; providers: ProviderDto[]; onClose: () => void; onSaved: () => void; onProviderCreated?: (p: ProviderDto) => void;
}

export const ProductModal: React.FC<Props> = ({ isOpen, product, providers, onClose, onSaved, onProviderCreated }) => {
  const [data, setData] = useState<Partial<ProductDto>>({});
  const [loading, setLoading] = useState(false);
  const [provModalOpen, setProvModalOpen] = useState(false);

  useEffect(() => {
    if (product) {
      const pMin = product.priceMinor ?? (product as any).price_minor ?? 0;
      const pMaj = product.priceMajor ?? (product as any).price_major ?? 0;
      const rawDiscs = product.minorPrices || (product as any).minor_prices || [];
      const normalized = rawDiscs.map((m: any) => ({
        id: m.id, conditionValue: m.conditionValue ?? m.condition_value ?? 0, priceValue: m.priceValue ?? m.price_value ?? 0,
      }));
      setData({ ...product, priceMajor: pMaj, priceMinor: pMin, providerId: product.providerId ?? (product as any).provider_id ?? '', minorPrices: normalized });
    } else {
      setData({ name: '', barcode: '', stock: 0, priceMajor: 0, priceMinor: 0, providerId: '', minorPrices: [] });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleGenBarcode = async () => {
    try { const code = await ApiClient.getNewBarcode(); setData((p) => ({ ...p, barcode: code })); } catch (e: any) { ToastService.error(e.message); }
  };

  const handleTier = (i: number, f: 'conditionValue' | 'priceValue', v: number) => {
    const list = [...(data.minorPrices || [])];
    while (list.length <= i) list.push({ conditionValue: 0, priceValue: 0 });
    list[i] = { ...list[i], [f]: v };
    setData((p) => ({ ...p, minorPrices: list }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { name: data.name, barcode: data.barcode || null, stock: Number(data.stock) || 0, provider_id: data.providerId || null, major_price: (data.priceMajor || 0) / 100, minor_price: (data.priceMinor || 0) / 100 };
      (data.minorPrices || []).forEach((t, i) => { if (t.conditionValue > 0 && t.priceValue > 0) { payload[`minor_price_condition_${i + 1}`] = t.conditionValue; payload[`minor_price_value_${i + 1}`] = t.priceValue / 100; } });
      if (product?.id) await ApiClient.updateProduct(product.id, payload);
      else await ApiClient.createProduct(payload);
      ToastService.success('Producto guardado.');
      onSaved(); onClose();
    } catch (e: any) { ToastService.error(e.message); } finally { setLoading(false); }
  };

  const selectedProv = providers.find((p) => p.id === data.providerId);
  return (
    <div className="modal-overlay"><div className="modal-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
        <button type="button" className="btn btn-secondary" style={{ padding: '4px' }} onClick={onClose}><X size={16} /></button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Código de Barras</label>
            <input type="text" className="input" value={data.barcode || ''} onChange={(e) => setData({ ...data, barcode: e.target.value })} /></div>
          <button type="button" className="btn btn-secondary" onClick={handleGenBarcode}><Wand2 size={16} /> Auto</button>
        </div>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre *</label>
          <input required type="text" className="input" value={data.name || ''} onChange={(e) => setData({ ...data, name: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>P. Minorista ($)</label>
            <input type="number" step="0.01" className="input" value={((data.priceMinor || 0) / 100).toString()} onChange={(e) => setData({ ...data, priceMinor: Math.round((parseFloat(e.target.value) || 0) * 100) })} /></div>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>P. Mayorista ($)</label>
            <input type="number" step="0.01" className="input" value={((data.priceMajor || 0) / 100).toString()} onChange={(e) => setData({ ...data, priceMajor: Math.round((parseFloat(e.target.value) || 0) * 100) })} /></div>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Stock</label>
            <input type="number" className="input" value={data.stock?.toString() || '0'} onChange={(e) => setData({ ...data, stock: parseInt(e.target.value) || 0 })} /></div>
        </div>
        <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Proveedor</label>
          <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', padding: '8px 12px' }} onClick={() => setProvModalOpen(true)}>
            <span>{selectedProv ? selectedProv.name : 'Sin Asignar (Buscar / Crear)'}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>
        </div>
        <ProductDiscountsSubForm minorPrices={data.minorPrices || []} onChange={handleTier} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
      <ProductProviderSelectModal isOpen={provModalOpen} selectedProviderId={data.providerId || null} providers={providers} onSelectProvider={(id) => setData({ ...data, providerId: id || undefined })} onProviderCreated={(p) => onProviderCreated?.(p)} onClose={() => setProvModalOpen(false)} />
    </div></div>
  );
};
