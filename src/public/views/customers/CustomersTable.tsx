import React from 'react';
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Tag } from 'lucide-react';
import { CustomerDto } from '../../types/api.types';
import { ImportanceBadge } from '../../components/ImportanceBadge';

interface CustomersTableProps {
  customers: CustomerDto[];
  loading: boolean;
  sortKey: string;
  onSortChange: (newSortKey: string) => void;
  onEdit: (customer: CustomerDto) => void;
  onDelete: (id: string) => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers, loading, sortKey, onSortChange, onEdit, onDelete,
}) => {
  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando clientes...</div>;
  if (customers.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron clientes con los filtros aplicados.</div>;

  const renderSortIcon = (ascKey: string, descKey: string) => {
    if (sortKey === ascKey) return <ArrowUp size={14} color="var(--brand-celeste-hover)" />;
    if (sortKey === descKey) return <ArrowDown size={14} color="var(--brand-celeste-hover)" />;
    return <ArrowUpDown size={14} style={{ opacity: 0.35 }} />;
  };

  const renderOrderTypeBadge = (rawType: unknown) => {
    const code = typeof rawType === 'object' && rawType !== null ? (rawType as { code?: string }).code : rawType;
    if (!code) {
      return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>Sin asignar</span>;
    }
    const isMajor = code === 'major';
    return (
      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, background: isMajor ? '#eff6ff' : '#f0fdf4', color: isMajor ? '#1d4ed8' : '#15803d' }}>
        {isMajor ? 'Mayorista' : 'Minorista'}
      </span>
    );
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSortChange(sortKey === 'name_asc' ? 'name_desc' : 'name_asc')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Nombre / Alias</span>
                {renderSortIcon('name_asc', 'name_desc')}
              </div>
            </th>
            <th>Importancia</th>
            <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSortChange(sortKey === 'cuil_asc' ? 'cuil_desc' : 'cuil_asc')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>CUIT/CUIL</span>
                {renderSortIcon('cuil_asc', 'cuil_desc')}
              </div>
            </th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Tipo Venta</th>
            <th style={{ width: '90px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                {c.whatsappName && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <Tag size={12} /> Alias: <strong>{c.whatsappName}</strong>
                  </div>
                )}
              </td>
              <td><ImportanceBadge importance={c.importance} /></td>
              <td><span style={{ fontFamily: 'monospace' }}>{c.cuil || '---'}</span></td>
              <td>{c.phone || '---'}</td>
              <td>{c.email || '---'}</td>
              <td>{renderOrderTypeBadge(c.defaultOrderType)}</td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => onEdit(c)} title="Editar"><Edit2 size={15} /></button>
                  <button className="btn btn-secondary" style={{ padding: '5px', color: 'var(--danger)' }} onClick={() => onDelete(c.id)} title="Eliminar"><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
