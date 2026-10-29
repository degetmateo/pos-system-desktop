import React, { useState, useEffect } from 'react';
import { Search, Plus, RotateCcw, X } from 'lucide-react';
import { CustomerDto } from '../types/api.types';
import { ApiClient } from '../services/api.client';
import { ToastService } from '../services/toast.service';
import { CustomersTable } from './customers/CustomersTable';
import { CustomerModal } from './customers/CustomerModal';
import { Pagination } from '../components/Pagination';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [docFilter, setDocFilter] = useState('');
  const [sortKey, setSortKey] = useState('name_asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);

  const loadData = async (
    query = search,
    t = typeFilter,
    doc = docFilter,
    sort = sortKey,
    p = page
  ) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        search: query,
        page: p,
        limit: 15,
        sorting: sort,
      };
      if (t) params.type = t;
      if (doc === 'with_cuil') params.has_cuil = 'true';
      else if (doc === 'without_cuil') params.has_cuil = 'false';
      else if (doc === 'with_phone') params.has_phone = 'true';
      else if (doc === 'with_email') params.has_email = 'true';

      const res = await ApiClient.getCustomersPaginated(params);
      setCustomers(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (e: any) {
      ToastService.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(search, typeFilter, docFilter, sortKey, page);
    }, 250);
    return () => clearTimeout(handler);
  }, [search, typeFilter, docFilter, sortKey, page]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setDocFilter('');
    setSortKey('name_asc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || typeFilter || docFilter || sortKey !== 'name_asc');

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    try {
      await ApiClient.deleteCustomer(id);
      ToastService.success('Cliente eliminado correctamente.');
      loadData(search, typeFilter, docFilter, sortKey, page);
    } catch (e: any) {
      ToastService.error(e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestión de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Directorio comercial y preferencias de facturación</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedCustomer(null); setModalOpen(true); }}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Main search input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px', background: '#f8fafc', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.92rem' }}
              placeholder="Buscar por nombre, CUIT/CUIL, teléfono, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => { setSearch(''); setPage(1); }}
                title="Borrar búsqueda"
              >
                <X size={16} color="var(--text-muted)" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div style={{ minWidth: '160px', flex: '0 1 180px' }}>
            <select
              className="select"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              title="Filtrar por tipo de venta por defecto"
            >
              <option value="">Todos los tipos</option>
              <option value="minor">Minorista</option>
              <option value="major">Mayorista</option>
            </select>
          </div>

          {/* Data completeness filter */}
          <div style={{ minWidth: '180px', flex: '0 1 200px' }}>
            <select
              className="select"
              value={docFilter}
              onChange={(e) => { setDocFilter(e.target.value); setPage(1); }}
              title="Filtrar por información de contacto o documento"
            >
              <option value="">Todos los datos</option>
              <option value="with_cuil">Con CUIT/CUIL</option>
              <option value="without_cuil">Sin CUIT/CUIL</option>
              <option value="with_phone">Con Teléfono</option>
              <option value="with_email">Con Email</option>
            </select>
          </div>

          {/* Sorting */}
          <div style={{ minWidth: '180px', flex: '0 1 200px' }}>
            <select
              className="select"
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
              title="Criterio de ordenamiento"
            >
              <option value="name_asc">Nombre: A - Z</option>
              <option value="name_desc">Nombre: Z - A</option>
              <option value="created_at_desc">Más recientes primero</option>
              <option value="created_at_asc">Más antiguos primero</option>
              <option value="cuil_asc">CUIT/CUIL: Menor a Mayor</option>
              <option value="cuil_desc">CUIT/CUIL: Mayor a Menor</option>
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={handleResetFilters}
              title="Limpiar filtros"
            >
              <RotateCcw size={14} /> Limpiar
            </button>
          )}
        </div>

        {/* Counter and active status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div>
            <span>Total encontrados: <strong>{totalItems}</strong> clientes</span>
            {hasActiveFilters && <span style={{ marginLeft: '8px', color: '#0369a1', fontWeight: 600 }}>• Filtros activos</span>}
          </div>
          <div>Página {page} de {totalPages}</div>
        </div>
      </div>

      <CustomersTable
        customers={customers}
        loading={loading}
        sortKey={sortKey}
        onSortChange={(k) => { setSortKey(k); setPage(1); }}
        onEdit={(c) => { setSelectedCustomer(c); setModalOpen(true); }}
        onDelete={handleDelete}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        disabled={loading}
      />

      <CustomerModal
        isOpen={modalOpen}
        customer={selectedCustomer}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData(search, typeFilter, docFilter, sortKey, page)}
      />
    </div>
  );
};
