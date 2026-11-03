import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, ExternalLink, Copy, Check, Network, ShieldAlert } from 'lucide-react';
import { ApiClient } from '../services/api.client';
import { AppInfo, NetworkInterfaceInfo } from '../types/api.types';
import { ToastService } from '../services/toast.service';
import { HomeShortcutGrid } from './home/HomeShortcutGrid';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('localhost:4000');
  const [copied, setCopied] = useState<boolean>(false);
  const [enablingFirewall, setEnablingFirewall] = useState<boolean>(false);

  const handleOpenFirewall = async () => {
    setEnablingFirewall(true);
    try {
      const res = await ApiClient.openFirewallPort();
      ToastService.success(res.message || 'Puerto 4000 habilitado en Windows Firewall.');
    } catch (err: any) {
      ToastService.error(err.message || 'No se pudo configurar el firewall.');
    } finally {
      setEnablingFirewall(false);
    }
  };

  useEffect(() => {
    ApiClient.getInfo()
      .then((info) => { setAppInfo(info); setSelectedIp(info.ip || 'localhost:4000'); })
      .catch(() => setSelectedIp('localhost:4000'));
  }, []);

  const fullUrl = `http://${selectedIp}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullUrl).then(() => {
      setCopied(true);
      ToastService.success('URL copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand-celeste-light)', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>
            <Wifi size={16} /> Servidor Activo en Red Local (LAN)
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', color: 'var(--brand-dark)' }}>Rubén Darío POS</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
            Acceda a la aplicación desde cualquier computadora, teléfono celular o tablet conectado a la misma red Wi-Fi o red local.
          </p>

          <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-dark)', flexWrap: 'wrap' }}>
            <span>{fullUrl}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={handleCopy} title="Copiar URL">
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
              <select className="select" style={{ maxWidth: '380px', fontSize: '0.85rem', padding: '6px 10px' }} value={selectedIp} onChange={(e) => setSelectedIp(e.target.value)}>
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

          <div style={{ marginTop: '14px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '0.82rem', color: '#475569' }}>
              <ShieldAlert size={15} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#f59e0b' }} />
              ¿No carga en el celular? Windows Firewall puede bloquear la versión de producción:
            </div>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px', background: '#fff' }} onClick={handleOpenFirewall} disabled={enablingFirewall}>
              {enablingFirewall ? 'Habilitando...' : 'Habilitar acceso en Firewall'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <QRCodeSVG value={fullUrl} size={180} level="M" />
          </div>
          <span style={{ marginTop: '14px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-dark)' }}>Escanear para acceder desde el celular</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>Abra la cámara del teléfono y apunte al código QR</span>
        </div>
      </div>

      <HomeShortcutGrid onNavigate={onNavigate} />
    </div>
  );
};
