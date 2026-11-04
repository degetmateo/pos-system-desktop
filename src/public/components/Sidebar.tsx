import React, { useSyncExternalStore } from 'react';
import { Home, ShoppingCart, Package, Users, FileText, FileSpreadsheet, Database, MessageCircle, BarChart3, X } from 'lucide-react';
import logoImg from '../logo.png';
import { whatsappBackgroundStore } from '../services/whatsapp-background.store';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const WhatsappNavBadge: React.FC = () => {
  const unread = useSyncExternalStore(
    whatsappBackgroundStore.subscribe,
    () => whatsappBackgroundStore.getSnapshot().totalUnread,
    () => 0
  );
  if (unread <= 0) return null;
  return (
    <span style={{
      marginLeft: 'auto', background: '#25d366', color: '#fff', fontSize: '0.72rem',
      fontWeight: 700, minWidth: '20px', height: '20px', borderRadius: '10px',
      padding: '0 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {unread > 99 ? '99+' : unread}
    </span>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const navItems = [
    { id: 'home', label: 'Inicio (Red LAN)', icon: <Home size={18} /> },
    { id: 'pos', label: 'Nueva Orden (V1)', icon: <ShoppingCart size={18} /> },
    { id: 'pos-v2', label: 'Nueva Orden (V2)', icon: <ShoppingCart size={18} /> },
    { id: 'products', label: 'Productos', icon: <Package size={18} /> },
    { id: 'customers', label: 'Clientes', icon: <Users size={18} /> },
    { id: 'orders', label: 'Órdenes', icon: <FileText size={18} /> },
    { id: 'lists', label: 'Listas Excel', icon: <FileSpreadsheet size={18} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> },
    { id: 'statistics', label: 'Estadísticas', icon: <BarChart3 size={18} /> },
    { id: 'backups', label: 'Backups / DB', icon: <Database size={18} /> },
  ];

  const handleSelect = (id: string, e?: React.MouseEvent) => {
    if (e?.currentTarget instanceof HTMLElement) {
      e.currentTarget.blur();
    }
    onNavigate(id);
    onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoImg} alt="Logo" className="sidebar-logo" />
          <span className="sidebar-title">Rubén Darío</span>
        </div>
        <button className="mobile-menu-btn" style={{ color: '#fff', padding: '4px' }} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={(e) => handleSelect(item.id, e)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === 'whatsapp' && <WhatsappNavBadge />}
          </button>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem', color: '#64748b' }}>
        RD v0.1.1
      </div>
    </aside>
  );
};
