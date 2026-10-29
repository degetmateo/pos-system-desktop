import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, RotateCcw, X } from 'lucide-react';
import { ProductDto, ProviderDto } from '../types/api.types';
import { ApiClient } from '../services/api.client';
import { ToastService } from '../services/toast.service';
import { ProductsTable } from './products/ProductsTable';
import { ProductModal } from './products/ProductModal';
import { ProductPriceHistoryModal } from './products/ProductPriceHistoryModal';
import { Pagination } from '../components/Pagination';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [providers, setProviders] = useState<ProviderDto[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortKey, setSortKey] = useState('name_asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [historyProduct, setHistoryProduct] = useState<ProductDto | null>(null);

  const loadData = async (
    query = search,
    prov = providerFilter,
    stock = stockFilter,
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
      if (prov) params.provider_id = prov;
      if (stock) params.stock_status = stock;

      const [res, provs] = await Promise.all([
        ApiClient.getProductsPaginated(params),
        providers.length === 0 ? ApiClient.getProviders() : Promise.resolve(providers),
      ]);

      setProducts(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
      if (providers.length === 0) setProviders(provs);
    } catch (e: any) {
      ToastService.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(search, providerFilter, stockFilter, sortKey, page);
    }, 250);
    return () => clearTimeout(handler);
  }, [search, providerFilter, stockFilter, sortKey, page]);

  const handleResetFilters = () => {
    setSearch('');
    setProviderFilter('');
    setStockFilter('');
    setSortKey('name_asc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || providerFilter || stockFilter || sortKey !== 'name_asc');

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      await ApiClient.deleteProduct(id);
      ToastService.success('Producto eliminado correctamente.');
      loadData(search, providerFilter, stockFilter, sortKey, page);
    } catch (e: any) {
      ToastService.error(e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Catálogo de Productos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona artículos, precios, stock y escalas de descuento</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedProduct(null); setModalOpen(true); }}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Main search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px', background: '#f8fafc', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.92rem' }}
              placeholder="Buscar por nombre, código de barras o descripción..."
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

          {/* Provider Filter */}
          <div style={{ minWidth: '180px', flex: '0 1 200px' }}>
            <select
              className="select"
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
              title="Filtrar por proveedor"
            >
              <option value="">Todos los proveedores</option>
              <option value="none">Sin proveedor asignado</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div style={{ minWidth: '160px', flex: '0 1 180px' }}>
            <select
              className="select"
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              title="Filtrar por stock"
            >
              <option value="">Todo el stock</option>
              <option value="in_stock">En stock (&gt; 0)</option>
              <option value="low_stock">Stock bajo (≤ 5 u.)</option>
              <option value="out_of_stock">Agotados (0 u.)</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div style={{ minWidth: '190px', flex: '0 1 210px' }}>
            <select
              className="select"
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
              title="Criterio de ordenamiento"
            >
              <option value="name_asc">Nombre: A - Z</option>
              <option value="name_desc">Nombre: Z - A</option>
              <option value="price_asc">Precio Min: Menor a Mayor</option>
              <option value="price_desc">Precio Min: Mayor a Menor</option>
              <option value="price_major_asc">Precio May: Menor a Mayor</option>
              <option value="price_major_desc">Precio May: Mayor a Menor</option>
              <option value="price_updated_at_desc">Precio: Modificado recientemente</option>
              <option value="price_updated_at_asc">Precio: Modificado antiguamente</option>
              <option value="stock_desc">Stock: Mayor a Menor</option>
              <option value="stock_asc">Stock: Menor a Mayor</option>
              <option value="created_at_desc">Más recientes primero</option>
              <option value="created_at_asc">Más antiguos primero</option>
              <option value="barcode_asc">Código: Menor a Mayor</option>
            </select>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={handleResetFilters}
              title="Limpiar todos los filtros"
            >
              <RotateCcw size={14} /> Limpiar
            </button>
          )}
        </div>

        {/* Counter and active status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div>
            <span>Total encontrados: <strong>{totalItems}</strong> productos</span>
            {hasActiveFilters && <span style={{ marginLeft: '8px', color: '#0369a1', fontWeight: 600 }}>• Filtros activos</span>}
          </div>
          <div>Página {page} de {totalPages}</div>
        </div>
      </div>

      <ProductsTable
        products={products}
        loading={loading}
        sortKey={sortKey}
        onSortChange={(k) => { setSortKey(k); setPage(1); }}
        onEdit={(p) => { setSelectedProduct(p); setModalOpen(true); }}
        onDelete={handleDelete}
        onViewPriceHistory={(p) => setHistoryProduct(p)}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        disabled={loading}
      />

      <ProductModal
        isOpen={modalOpen}
        product={selectedProduct}
        providers={providers}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData(search, providerFilter, stockFilter, sortKey, page)}
        onProviderCreated={(newProv) => setProviders((prev) => [...prev, newProv])}
      />

      <ProductPriceHistoryModal
        isOpen={Boolean(historyProduct)}
        product={historyProduct}
        onClose={() => setHistoryProduct(null)}
      />
    </div>
  );
};
