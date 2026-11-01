export type PosV2ColumnName = 'name' | 'quantity' | 'unitPrice';

export interface PosV2NavigationResult {
  action: 'create_row' | 'focus_cell';
  targetRowIndex: number;
  targetColName: PosV2ColumnName;
}

export interface PosV2TabResult {
  action: 'focus_cell' | 'stay';
  targetRowIndex: number;
  targetColName: PosV2ColumnName;
}

export class PosV2GridNavigator {
  public static getNextCell(
    currentRowIndex: number,
    currentColName: PosV2ColumnName,
    totalRows: number
  ): PosV2NavigationResult {
    const isLastRow = currentRowIndex >= totalRows - 1;
    if (isLastRow) {
      return {
        action: 'create_row',
        targetRowIndex: currentRowIndex + 1,
        targetColName: 'name',
      };
    }
    return {
      action: 'focus_cell',
      targetRowIndex: currentRowIndex + 1,
      targetColName: currentColName,
    };
  }

  public static getNextTabCell(
    currentRowIndex: number,
    totalRows: number
  ): PosV2TabResult {
    if (currentRowIndex < totalRows - 1) {
      return {
        action: 'focus_cell',
        targetRowIndex: currentRowIndex + 1,
        targetColName: 'name',
      };
    }
    return {
      action: 'stay',
      targetRowIndex: currentRowIndex,
      targetColName: 'unitPrice',
    };
  }

  public static getNextMenuIndex(
    currentIndex: number,
    direction: 'up' | 'down',
    totalMatches: number
  ): number {
    if (totalMatches <= 0) return -1;
    if (direction === 'down') {
      if (currentIndex === -1) return 0;
      return currentIndex < totalMatches - 1 ? currentIndex + 1 : currentIndex;
    }
    if (currentIndex <= 0) return -1;
    return currentIndex - 1;
  }

  public static calculateScrollTop(
    itemTop: number,
    itemHeight: number,
    currentScrollTop: number,
    containerClientHeight: number
  ): number {
    const itemBottom = itemTop + itemHeight;
    if (itemTop < currentScrollTop) {
      return itemTop;
    }
    if (itemBottom > currentScrollTop + containerClientHeight) {
      return itemBottom - containerClientHeight;
    }
    return currentScrollTop;
  }
}
