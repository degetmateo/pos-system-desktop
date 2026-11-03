import React from 'react';
import { ShoppingCart, FileSpreadsheet, MessageCircle, BarChart3, Package, Users, FileText, Database } from 'lucide-react';

interface HomeShortcutGridProps {
  onNavigate: (view: string) => void;
}

export const HomeShortcutGrid: React.FC<HomeShortcutGridProps> = ({ onNavigate }) => {
  const shortcuts = [
    { id: 'pos', title: 'Punto de Venta (V1)', desc: 'Facturación estándar por búsqueda o lector de barras', icon: <ShoppingCart size={24} color="#0284c7" /> },
    { id: 'pos-v2', title: 'Nueva Orden V2 (Excel)', desc: 'Planilla rápida con autocompletado y edición de precios', icon: <FileSpreadsheet size={24} color="#059669" /> },
    { id: 'whatsapp', title: 'WhatsApp', desc: 'Atención al cliente, clientes prioritarios y QR integrado', icon: <MessageCircle size={24} color="#00a884" /> },
    { id: 'statistics', title: 'Estadísticas', desc: 'Gráficos de ventas, precios, compras de clientes y mensajes', icon: <BarChart3 size={24} color="#7c3aed" /> },
    { id: 'products', title: 'Productos', desc: 'Catálogo, precios y descuentos', icon: <Package size={24} color="#10b981" /> },
    { id: 'customers', title: 'Clientes', desc: 'Agenda sincronizada con WhatsApp e importancia', icon: <Users size={24} color="#8b5cf6" /> },
    { id: 'orders', title: 'Órdenes', desc: 'Historial de ventas y comprobantes', icon: <FileText size={24} color="#f59e0b" /> },
    { id: 'backups', title: 'Mantenimiento', desc: 'Copias de seguridad y base de datos', icon: <Database size={24} color="#64748b" /> },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {shortcuts.map((item) => (
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
  );
};
