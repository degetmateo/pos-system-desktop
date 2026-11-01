import { useState, useEffect } from 'react';
import { CustomerDto, ProductDto, OrderDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';
import { ToastService } from '../../services/toast.service';
import { OrderDraftStorage } from '../../services/order-draft.storage';
import { PosV2RowItem } from './pos.types';
import { PosV2Calculator } from './PosV2Calculator';
import { PosV2GridNavigator, PosV2ColumnName } from './PosV2GridNavigator';

export function usePosV2Order() {
  const initialDraft = OrderDraftStorage.getDraftV2();
  const [rows, setRows] = useState<PosV2RowItem[]>(
    initialDraft?.rows && initialDraft.rows.length > 0 ? initialDraft.rows : [PosV2Calculator.createEmptyRow()]
  );
  const [orderType, setOrderType] = useState<'minor' | 'major'>(initialDraft?.orderType || 'minor');
  const [customerId, setCustomerId] = useState<string>(initialDraft?.customerId || '');
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>(initialDraft?.paymentMethod || 'cash');
  const [advancement, setAdvancement] = useState<number>(initialDraft?.advancement || 0);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null);

  useEffect(() => { ApiClient.getCustomers().then(setCustomers).catch(() => {}); }, []);

  useEffect(() => {
    OrderDraftStorage.saveDraftV2({ rows, orderType, customerId, paymentMethod, advancement });
  }, [rows, orderType, customerId, paymentMethod, advancement]);

  const handleUpdateRow = (id: string, patch: Partial<PosV2RowItem>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length > 0 ? next : [PosV2Calculator.createEmptyRow()];
    });
  };

  const handleAddRow = () => setRows((prev) => [...prev, PosV2Calculator.createEmptyRow()]);

  const handleCellEnter = (rowIndex: number, colName: PosV2ColumnName) => {
    const nav = PosV2GridNavigator.getNextCell(rowIndex, colName, rows.length);
    if (nav.action === 'create_row') {
      handleAddRow();
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(
          `input[data-pos-row="${nav.targetRowIndex}"][data-pos-col="${nav.targetColName}"]`
        );
        if (el) { el.focus(); el.select?.(); }
      }, 50);
    } else {
      const el = document.querySelector<HTMLInputElement>(
        `input[data-pos-row="${nav.targetRowIndex}"][data-pos-col="${nav.targetColName}"]`
      );
      if (el) { el.focus(); el.select?.(); }
    }
  };

  const handleTabUnitPrice = (rowIndex: number) => {
    const nav = PosV2GridNavigator.getNextTabCell(rowIndex, rows.length);
    if (nav.action === 'focus_cell') {
      const el = document.querySelector<HTMLInputElement>(
        `input[data-pos-row="${nav.targetRowIndex}"][data-pos-col="${nav.targetColName}"]`
      );
      if (el) { el.focus(); el.select?.(); }
    }
  };

  const handleSelectProduct = (p: ProductDto) => {
    const rawCents = orderType === 'major'
      ? (typeof p.priceMajor === 'object' && p.priceMajor !== null ? (p.priceMajor as any).cents : p.priceMajor)
      : (typeof p.priceMinor === 'object' && p.priceMinor !== null ? (p.priceMinor as any).cents : p.priceMinor);
    const decimalPrice = (rawCents || 0) / 100;

    setRows((prev) => {
      const last = prev[prev.length - 1];
      const newRow: PosV2RowItem = {
        id: last && !last.productName.trim() ? last.id : PosV2Calculator.createEmptyRow().id,
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: decimalPrice,
        originalPrice: decimalPrice,
        isNewProduct: false,
        saveToDb: false,
        updatePriceInDb: false,
      };
      return last && !last.productName.trim() ? [...prev.slice(0, -1), newRow] : [...prev, newRow];
    });
    ToastService.success(`Agregado: ${p.name}`);
  };

  const handleReset = () => {
    setRows([PosV2Calculator.createEmptyRow()]);
    setAdvancement(0);
    OrderDraftStorage.clearDraftV2();
  };

  const handleSubmit = async () => {
    const dto = PosV2Calculator.buildCreateOrderDto(rows, customerId, orderType, paymentMethod, advancement);
    if (dto.products.length === 0) {
      ToastService.error('Debes ingresar al menos un producto con nombre y cantidad.');
      return;
    }
    setLoading(true);
    try {
      const order = await ApiClient.createOrder(dto);
      setCreatedOrder(order);
      setRows([PosV2Calculator.createEmptyRow()]);
      setAdvancement(0);
      OrderDraftStorage.clearDraftV2();
      ToastService.success('Orden creada exitosamente.');
    } catch (e: any) {
      ToastService.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    rows, orderType, customerId, customers, paymentMethod, advancement, loading, createdOrder,
    setOrderType, setCustomerId, setPaymentMethod, setAdvancement, setCreatedOrder,
    handleUpdateRow, handleDeleteRow, handleAddRow, handleCellEnter, handleTabUnitPrice, handleSelectProduct, handleReset, handleSubmit,
  };
}
