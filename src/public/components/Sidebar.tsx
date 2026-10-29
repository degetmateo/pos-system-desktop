import React from 'react';
import { Home, ShoppingCart, Package, Users, FileText, FileSpreadsheet, Database, X } from 'lucide-react';
import logoImg from '../logo.png';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const navItems = [
    { id: 'home', label: 'Inicio (Red LAN)', icon: <Home size={18} /> },
    { id: 'pos', label: 'Punto de Venta', icon: <ShoppingCart size={18} /> },
    { id: 'products', label: 'Productos', icon: <Package size={18} /> },
    { id: 'customers', label: 'Clientes', icon: <Users size={18} /> },
    { id: 'orders', label: 'Órdenes', icon: <FileText size={18} /> },
    { id: 'lists', label: 'Listas Excel', icon: <FileSpreadsheet size={18} /> },
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
          </button>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem', color: '#64748b' }}>
        RD POS v0.0.22 Desktop & LAN
      </div>
    </aside>
  );
};

