import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, ShoppingCart, Package, Users, FileText, Database, ExternalLink, Copy, Check, Network } from 'lucide-react';
import { ApiClient } from '../services/api.client';
import { AppInfo, NetworkInterfaceInfo } from '../types/api.types';
import { ToastService } from '../services/toast.service';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('localhost:4000');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    ApiClient.getInfo()
      .then((info) => {
        setAppInfo(info);
        setSelectedIp(info.ip || 'localhost:4000');
      })
      .catch(() => {
        setSelectedIp('localhost:4000');
      })
      .finally(() => setLoading(false));
  }, []);

  const fullUrl = `http://${selectedIp}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopied(true);
        ToastService.success('URL copiada al portapapeles');
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand-celeste-light)', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>
            <Wifi size={16} /> Servidor Activo en Red Local (LAN)
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', color: 'var(--brand-dark)' }}>
            Rubén Darío POS
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
            Acceda a la aplicación desde cualquier computadora, teléfono celular o tablet conectado a la misma red Wi-Fi o red local.
          </p>

          <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-dark)', flexWrap: 'wrap' }}>
            <span>{fullUrl}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                onClick={handleCopy}
                title="Copiar URL"
              >
                {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
              <a href={fullUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Abrir en pestaña nueva">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {appInfo && appInfo.interfaces && appInfo.interfaces.length > 1 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Network size={14} /> Seleccionar adaptador de red detectado:
              </label>
              <select
                className="select"
                style={{ maxWidth: '380px', fontSize: '0.85rem', padding: '6px 10px' }}
                value={selectedIp}
                onChange={(e) => setSelectedIp(e.target.value)}
              >
                {appInfo.interfaces.map((iface: NetworkInterfaceInfo) => (
                  <option key={iface.ip} value={`${iface.ip}:${iface.port}`}>
                    {iface.name}: {iface.ip} {iface.isDefault ? '(Recomendado)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            * Recuerde que su teléfono o dispositivo móvil debe estar conectado a la <strong>misma red Wi-Fi</strong> que esta computadora.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <QRCodeSVG value={fullUrl} size={180} level="M" />
          </div>
          <span style={{ marginTop: '14px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-dark)' }}>
            Escanear para acceder desde el celular
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
            Abra la cámara del teléfono y apunte al código QR
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { id: 'pos', title: 'Punto de Venta', desc: 'Facturación rápida y códigos de barra', icon: <ShoppingCart size={24} color="#0284c7" /> },
          { id: 'products', title: 'Productos', desc: 'Catálogo, precios y descuentos', icon: <Package size={24} color="#10b981" /> },
          { id: 'customers', title: 'Clientes', desc: 'Cuentas corrientes y datos de contacto', icon: <Users size={24} color="#8b5cf6" /> },
          { id: 'orders', title: 'Órdenes', desc: 'Historial de ventas y comprobantes', icon: <FileText size={24} color="#f59e0b" /> },
          { id: 'backups', title: 'Mantenimiento', desc: 'Copias de seguridad y base de datos', icon: <Database size={24} color="#64748b" /> },
        ].map((item) => (
          <div
            key={item.id}
            className="card"
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
            onClick={() => onNavigate(item.id)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            <div style={{ marginBottom: '12px' }}>{item.icon}</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
