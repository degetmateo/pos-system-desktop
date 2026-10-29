import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { ToastService } from '../services/toast.service';

export const PriceListsView: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excel', file);
    setImporting(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/lists/products-internal', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error al procesar el archivo Excel.');
      setResultMsg(`Se procesaron correctamente ${data.data?.processedCount || 0} artículos.`);
      ToastService.success('Lista de precios importada correctamente.');
    } catch (err: any) {
      ToastService.error(err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Listas de Precios e Integración Excel</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Exportación y actualización masiva de precios y escalas por planilla de cálculo</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#dcfce7', padding: '10px', borderRadius: 'var(--radius-sm)', color: '#16a34a' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Lista Interna de Precios</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Para administración y actualización de precios</p>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Contiene la totalidad del catálogo con IDs únicos, códigos de barra, precios mayoristas, minoristas y las 4 columnas de descuento por volumen.
          </p>
          <a href="/api/lists/products-internal" download className="btn btn-secondary" style={{ marginTop: 'auto' }}>
            <Download size={16} /> Descargar Excel Interno
          </a>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: 'var(--radius-sm)', color: '#0284c7' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Lista de Precios para Clientes</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formato limpio para compartir por WhatsApp o email</p>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Planilla formateada sin datos internos sensibles, lista para imprimir o enviar comercialmente a clientes con precios de venta actualizados.
          </p>
          <a href="/api/lists/products-customers" download className="btn btn-secondary" style={{ marginTop: 'auto' }}>
            <Download size={16} /> Descargar Lista Clientes
          </a>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Importación Masiva de Precios</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Suba la planilla de Lista Interna modificada para actualizar precios, costos y escalas de descuento de forma atómica en la base de datos.
        </p>

        <label className="btn btn-primary" style={{ alignSelf: 'flex-start', cursor: importing ? 'wait' : 'pointer' }}>
          <Upload size={16} /> {importing ? 'Procesando archivo...' : 'Seleccionar Archivo Excel (.xlsx)'}
          <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} disabled={importing} onChange={handleFileUpload} />
        </label>

        {resultMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {resultMsg}
          </div>
        )}
      </div>
    </div>
  );
};

