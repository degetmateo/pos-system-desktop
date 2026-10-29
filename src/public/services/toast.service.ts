export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

type ToastListener = (toasts: ToastMessage[]) => void;

export class ToastService {
  private static toasts: ToastMessage[] = [];
  private static listeners: Set<ToastListener> = new Set();

  public static subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => this.listeners.delete(listener);
  }

  public static show(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast: ToastMessage = { id: Math.random().toString(36).substring(2, 9), text, type };
    this.toasts = [...this.toasts, toast];
    this.notify();

    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== toast.id);
      this.notify();
    }, 3500);
  }

  public static success(text: string): void {
    this.show(text, 'success');
  }

  public static error(text: string): void {
    this.show(text, 'error');
  }

  private static notify(): void {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }
}

