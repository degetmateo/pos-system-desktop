import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CustomerDto } from '../types/api.types';
import { ApiClient } from '../services/api.client';
import { ToastService } from '../services/toast.service';
import { ViewPreferenceStorage } from '../services/view-preference.storage';
import { CustomersFilterBar } from './customers/CustomersFilterBar';
import { CustomersTable } from './customers/CustomersTable';
import { CustomerModal } from './customers/CustomerModal';
import { Pagination } from '../components/Pagination';

export const CustomersView: React.FC = () => {
  const initialPrefs = ViewPreferenceStorage.getCustomers();
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [search, setSearch] = useState(initialPrefs.search);
  const [typeFilter, setTypeFilter] = useState(initialPrefs.typeFilter);
  const [importanceFilter, setImportanceFilter] = useState(initialPrefs.importanceFilter || '');
  const [docFilter, setDocFilter] = useState(initialPrefs.docFilter);
  const [sortKey, setSortKey] = useState(initialPrefs.sortKey || 'name_asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);

  useEffect(() => {
    ViewPreferenceStorage.saveCustomers({ search, typeFilter, importanceFilter, docFilter, sortKey });
  }, [search, typeFilter, importanceFilter, docFilter, sortKey]);

  const loadData = async (q = search, t = typeFilter, imp = importanceFilter, doc = docFilter, sort = sortKey, p = page) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { search: q, page: p, limit: 15, sorting: sort };
      if (t) params.type = t;
      if (imp) params.importance = imp;
      if (doc === 'with_cuil') params.has_cuil = 'true';
      else if (doc === 'without_cuil') params.has_cuil = 'false';
      else if (doc === 'with_phone') params.has_phone = 'true';
      else if (doc === 'with_email') params.has_email = 'true';

      const res = await ApiClient.getCustomersPaginated(params);
      setCustomers(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (e: any) { ToastService.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => void loadData(search, typeFilter, importanceFilter, docFilter, sortKey, page), 220);
    return () => clearTimeout(timer);
  }, [search, typeFilter, importanceFilter, docFilter, sortKey, page]);

  const handleReset = () => {
    setSearch(''); setTypeFilter(''); setImportanceFilter(''); setDocFilter(''); setSortKey('name_asc'); setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    try {
      await ApiClient.deleteCustomer(id);
      ToastService.success('Cliente eliminado correctamente.');
      void loadData(search, typeFilter, importanceFilter, docFilter, sortKey, page);
    } catch (e: any) { ToastService.error(e.message); }
  };

  const hasActiveFilters = Boolean(search || typeFilter || importanceFilter || docFilter || sortKey !== 'name_asc');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestión de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Directorio comercial sincronizado con WhatsApp</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedCustomer(null); setModalOpen(true); }}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <CustomersFilterBar
        search={search} typeFilter={typeFilter} importanceFilter={importanceFilter} docFilter={docFilter} sortKey={sortKey}
        totalItems={totalItems} page={page} totalPages={totalPages} hasActiveFilters={hasActiveFilters}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onTypeChange={(v) => { setTypeFilter(v); setPage(1); }}
        onImportanceChange={(v) => { setImportanceFilter(v); setPage(1); }}
        onDocChange={(v) => { setDocFilter(v); setPage(1); }}
        onSortChange={(v) => { setSortKey(v); setPage(1); }}
        onReset={handleReset}
      />

      <CustomersTable
        customers={customers} loading={loading} sortKey={sortKey}
        onSortChange={(k) => { setSortKey(k); setPage(1); }}
        onEdit={(c) => { setSelectedCustomer(c); setModalOpen(true); }}
        onDelete={handleDelete}
      />

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} disabled={loading} />

      <CustomerModal
        isOpen={modalOpen} customer={selectedCustomer} onClose={() => setModalOpen(false)}
        onSaved={() => void loadData(search, typeFilter, importanceFilter, docFilter, sortKey, page)}
      />
    </div>
  );
};
