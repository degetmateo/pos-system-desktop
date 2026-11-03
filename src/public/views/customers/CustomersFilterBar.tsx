import React from 'react';
import { Search, RotateCcw, X } from 'lucide-react';

interface CustomersFilterBarProps {
  search: string;
  typeFilter: string;
  importanceFilter: string;
  docFilter: string;
  sortKey: string;
  totalItems: number;
  page: number;
  totalPages: number;
  hasActiveFilters: boolean;
  onSearchChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  onImportanceChange: (val: string) => void;
  onDocChange: (val: string) => void;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

export const CustomersFilterBar: React.FC<CustomersFilterBarProps> = ({
  search, typeFilter, importanceFilter, docFilter, sortKey,
  totalItems, page, totalPages, hasActiveFilters,
  onSearchChange, onTypeChange, onImportanceChange, onDocChange, onSortChange, onReset,
}) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 250px', background: '#f8fafc', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
          placeholder="Buscar por nombre, agendado en WSP, teléfono, email, CUIT..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onSearchChange('')} title="Borrar búsqueda">
            <X size={16} color="var(--text-muted)" />
          </button>
        )}
      </div>

      <select className="select" style={{ flex: '0 1 165px' }} value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} title="Tipo de venta">
        <option value="">Todos los tipos</option>
        <option value="minor">Minorista</option>
        <option value="major">Mayorista</option>
        <option value="unassigned">Sin asignar (WSP)</option>
      </select>

      <select className="select" style={{ flex: '0 1 170px' }} value={importanceFilter} onChange={(e) => onImportanceChange(e.target.value)} title="Nivel de importancia">
        <option value="">Toda importancia</option>
        <option value="important">Importante</option>
        <option value="normal">Normal</option>
        <option value="low">Poca importancia</option>
        <option value="ignore">Ignorar</option>
      </select>

      <select className="select" style={{ flex: '0 1 165px' }} value={docFilter} onChange={(e) => onDocChange(e.target.value)} title="Datos de contacto">
        <option value="">Todos los datos</option>
        <option value="with_cuil">Con CUIT/CUIL</option>
        <option value="without_cuil">Sin CUIT/CUIL</option>
        <option value="with_phone">Con Teléfono</option>
        <option value="with_email">Con Email</option>
      </select>

      <select className="select" style={{ flex: '0 1 190px' }} value={sortKey} onChange={(e) => onSortChange(e.target.value)} title="Ordenamiento">
        <option value="name_asc">Nombre: A - Z</option>
        <option value="name_desc">Nombre: Z - A</option>
        <option value="importance_desc">Mayor importancia</option>
        <option value="created_at_desc">Más recientes</option>
        <option value="created_at_asc">Más antiguos</option>
        <option value="cuil_asc">CUIT: Menor a Mayor</option>
      </select>

      {hasActiveFilters && (
        <button type="button" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={onReset}>
          <RotateCcw size={14} /> Limpiar
        </button>
      )}
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
      <div>
        <span>Total encontrados: <strong>{totalItems}</strong> clientes</span>
        {hasActiveFilters && <span style={{ marginLeft: '8px', color: '#0369a1', fontWeight: 600 }}>• Filtros activos</span>}
      </div>
      <div>Página {page} de {totalPages}</div>
    </div>
  </div>
);

