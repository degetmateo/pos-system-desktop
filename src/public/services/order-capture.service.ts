import { ToastService } from './toast.service';
import { ApiClient } from './api.client';
import { OrderDto } from '../types/api.types';
import { OrderCaptureData } from './order-capture.types';
import { OrderCaptureCanvas } from './order-capture.canvas';
import { OrderCaptureMapper } from './order-capture.mapper';

export class OrderCaptureService {
  public static async copyTableCapture(data: OrderCaptureData): Promise<boolean> {
    try {
      const blob = await OrderCaptureCanvas.generate(data);
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        ToastService.success('¡Captura copiada al portapapeles! Lista para pegar.');
        return true;
      }
      this.downloadBlob(blob, `Presupuesto_Ruben_Dario_${data.orderNumber || 'Borrador'}.png`);
      ToastService.success('Captura descargada como imagen.');
      return true;
    } catch (err: any) {
      console.warn('[OrderCaptureService] Error al copiar imagen:', err);
      try {
        const blob = await OrderCaptureCanvas.generate(data);
        this.downloadBlob(blob, `Presupuesto_Ruben_Dario_${data.orderNumber || 'Borrador'}.png`);
        ToastService.success('Captura descargada como imagen.');
        return true;
      } catch {
        ToastService.error('No se pudo generar la captura.');
        return false;
      }
    }
  }

  public static async copyOrderCapture(order: OrderDto, fallbackNumber?: number | null): Promise<boolean> {
    const data = OrderCaptureMapper.fromOrder(order, fallbackNumber);
    return this.copyTableCapture(data);
  }

  public static async copyOrderPdf(orderId: string, orderNumber?: number | null): Promise<boolean> {
    try {
      await ApiClient.copyOrderPdf(orderId);
      try {
        const res = await fetch(`/api/orders/receipt/${orderId}`);
        const blob = await res.blob();
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([new ClipboardItem({ 'application/pdf': blob })]);
        }
      } catch {}

      ToastService.success('¡PDF copiado al portapapeles! Listo para pegar con Ctrl + V.');
      return true;
    } catch (err: any) {
      ToastService.error(err.message || 'Error al copiar el PDF.');
      return false;
    }
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
