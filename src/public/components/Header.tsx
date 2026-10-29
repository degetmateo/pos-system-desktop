import React, { useEffect, useState } from 'react';
import { Menu, Wifi } from 'lucide-react';
import { ApiClient } from '../services/api.client';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, currentView }) => {
  const [lanIp, setLanIp] = useState<string>('localhost:4000');

  useEffect(() => {
    ApiClient.getInfo().then((i) => setLanIp(i.ip || 'localhost:4000')).catch(() => {});
  }, []);

  const titles: Record<string, string> = {
    home: 'Inicio y Conexión LAN',
    pos: 'Punto de Venta',
    products: 'Catálogo de Productos',
    customers: 'Gestión de Clientes',
    orders: 'Historial de Órdenes',
    lists: 'Listas de Precios',
    backups: 'Mantenimiento y Respaldo',
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="mobile-menu-btn" onClick={onToggleSidebar}>
          <Menu size={22} color="var(--brand-dark)" />
        </button>
        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{titles[currentView] || 'Rubén Darío'}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        <Wifi size={14} color="#0369a1" />
        <span style={{ color: 'var(--brand-dark)' }}>{lanIp}</span>
      </div>
    </header>
  );
};

