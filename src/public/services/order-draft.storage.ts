import { PosDraftV1, PosDraftV2 } from '../views/pos/pos.types';

export class OrderDraftStorage {
  private static readonly V1_KEY = 'rd_pos_draft_v1';
  private static readonly V2_KEY = 'rd_pos_draft_v2';

  public static getDraftV1(): PosDraftV1 | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(this.V1_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static saveDraftV1(draft: PosDraftV1): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.V1_KEY, JSON.stringify(draft));
      }
    } catch {
      // Ignore write errors
    }
  }

  public static clearDraftV1(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.V1_KEY);
      }
    } catch {
      // Ignore removal errors
    }
  }

  public static getDraftV2(): PosDraftV2 | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(this.V2_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static saveDraftV2(draft: PosDraftV2): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.V2_KEY, JSON.stringify(draft));
      }
    } catch {
      // Ignore write errors
    }
  }

  public static clearDraftV2(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.V2_KEY);
      }
    } catch {
      // Ignore removal errors
    }
  }
}

