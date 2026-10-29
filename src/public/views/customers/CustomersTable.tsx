import React from 'react';
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { CustomerDto } from '../../types/api.types';

interface CustomersTableProps {
  customers: CustomerDto[];
  loading: boolean;
  sortKey: string;
  onSortChange: (newSortKey: string) => void;
  onEdit: (customer: CustomerDto) => void;
  onDelete: (id: string) => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  loading,
  sortKey,
  onSortChange,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando clientes...</div>;
  }
  if (customers.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron clientes con los filtros aplicados.</div>;
  }

  const renderSortIcon = (ascKey: string, descKey: string) => {
    if (sortKey === ascKey) return <ArrowUp size={14} color="var(--brand-celeste-hover)" />;
    if (sortKey === descKey) return <ArrowDown size={14} color="var(--brand-celeste-hover)" />;
    return <ArrowUpDown size={14} style={{ opacity: 0.35 }} />;
  };

  const handleHeaderClick = (ascKey: string, descKey: string) => {
    if (sortKey === ascKey) {
      onSortChange(descKey);
    } else {
      onSortChange(ascKey);
    }
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('name_asc', 'name_desc')}
              title="Ordenar por Nombre"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Nombre / Razón Social</span>
                {renderSortIcon('name_asc', 'name_desc')}
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleHeaderClick('cuil_asc', 'cuil_desc')}
              title="Ordenar por CUIT/CUIL"
            >
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
          {customers.map((c) => {
            const typeStr = typeof c.defaultOrderType === 'object' && c.defaultOrderType !== null ? (c.defaultOrderType as any).code : (c.defaultOrderType || 'minor');
            const isMajor = typeStr === 'major';
            return (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>
                  <span style={{ fontFamily: 'monospace' }}>{c.cuil || '---'}</span>
                </td>
                <td>{c.phone || '---'}</td>
                <td>{c.email || '---'}</td>
                <td>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: isMajor ? '#eff6ff' : '#f0fdf4', color: isMajor ? '#1d4ed8' : '#15803d' }}>
                    {isMajor ? 'Mayorista' : 'Minorista'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => onEdit(c)} title="Editar"><Edit2 size={15} /></button>
                    <button className="btn btn-secondary" style={{ padding: '5px', color: 'var(--danger)' }} onClick={() => onDelete(c.id)} title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
