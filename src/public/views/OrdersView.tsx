import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, X, Calendar, DollarSign } from 'lucide-react';
import { OrderDto } from '../types/api.types';
import { ApiClient } from '../services/api.client';
import { ToastService } from '../services/toast.service';
import { OrdersTable } from './orders/OrdersTable';
import { OrderDetailModal } from './orders/OrderDetailModal';
import { Pagination } from '../components/Pagination';

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [datePeriod, setDatePeriod] = useState('');
  const [sortKey, setSortKey] = useState('created_at_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  const getDateRange = (period: string): { startDate?: string; endDate?: string } => {
    if (!period) return {};
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (period === 'last_7_days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      return { startDate: past.toISOString().split('T')[0], endDate: todayStr };
    }
    if (period === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { startDate: firstDay, endDate: todayStr };
    }
    return {};
  };

  const loadData = async (
    query = search,
    type = typeFilter,
    payment = paymentFilter,
    period = datePeriod,
    sort = sortKey,
    p = page
  ) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(period);
      const params: Record<string, string | number> = {
        search: query,
        page: p,
        limit: 15,
        sorting: sort,
      };
      if (type) params.type = type;
      if (payment) params.payment_method = payment;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await ApiClient.getOrdersPaginated(params);
      setOrders(res.items);
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
      loadData(search, typeFilter, paymentFilter, datePeriod, sortKey, page);
    }, 250);
    return () => clearTimeout(handler);
  }, [search, typeFilter, paymentFilter, datePeriod, sortKey, page]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setPaymentFilter('');
    setDatePeriod('');
    setSortKey('created_at_desc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || typeFilter || paymentFilter || datePeriod || sortKey !== 'created_at_desc');

  // Calculate sum of displayed orders on current page
  const pageTotalSum = orders.reduce((acc, o) => {
    const cents = typeof o.totalPrice === 'object' && o.totalPrice !== null ? (o.totalPrice as any).cents : (o.totalPrice || 0);
    return acc + cents;
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Historial de Órdenes</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Consulta de comprobantes emitidos, reimpresión y descargas en PDF</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Main search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', background: '#f8fafc', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.92rem' }}
              placeholder="Buscar por cliente, CUIT o N° de orden (#12)..."
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
          <div style={{ minWidth: '150px', flex: '0 1 170px' }}>
            <select
              className="select"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              title="Filtrar por tipo de orden"
            >
              <option value="">Todos los tipos</option>
              <option value="minor">Minorista</option>
              <option value="major">Mayorista</option>
            </select>
          </div>

          {/* Payment Method filter */}
          <div style={{ minWidth: '160px', flex: '0 1 180px' }}>
            <select
              className="select"
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              title="Filtrar por método de pago"
            >
              <option value="">Todos los pagos</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
              <option value="current_account">Cuenta Corriente</option>
            </select>
          </div>

          {/* Date range filter */}
          <div style={{ minWidth: '160px', flex: '0 1 180px' }}>
            <select
              className="select"
              value={datePeriod}
              onChange={(e) => { setDatePeriod(e.target.value); setPage(1); }}
              title="Filtrar por período de fecha"
            >
              <option value="">Cualquier fecha</option>
              <option value="today">Hoy</option>
              <option value="last_7_days">Últimos 7 días</option>
              <option value="this_month">Este mes</option>
            </select>
          </div>

          {/* Sorting */}
          <div style={{ minWidth: '190px', flex: '0 1 210px' }}>
            <select
              className="select"
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
              title="Criterio de ordenamiento"
            >
              <option value="created_at_desc">Fecha: Más recientes primero</option>
              <option value="created_at_asc">Fecha: Más antiguas primero</option>
              <option value="number_desc">N° Orden: Mayor a Menor</option>
              <option value="number_asc">N° Orden: Menor a Mayor</option>
              <option value="total_desc">Total: Mayor a Menor</option>
              <option value="total_asc">Total: Menor a Mayor</option>
              <option value="customer_asc">Cliente: A - Z</option>
              <option value="customer_desc">Cliente: Z - A</option>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Total registradas: <strong>{totalItems}</strong> órdenes</span>
            {orders.length > 0 && (
              <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Total página: ${(pageTotalSum / 100).toFixed(2)}
              </span>
            )}
            {hasActiveFilters && <span style={{ color: '#0369a1', fontWeight: 600 }}>• Filtros activos</span>}
          </div>
          <div>Página {page} de {totalPages}</div>
        </div>
      </div>

      <OrdersTable
        orders={orders}
        loading={loading}
        sortKey={sortKey}
        onSortChange={(k) => { setSortKey(k); setPage(1); }}
        onSelectOrder={setSelectedOrder}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        disabled={loading}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};
