import { describe, it, expect } from 'vitest';
import { PosV2GridNavigator } from '../../src/public/views/pos/PosV2GridNavigator';

describe('PosV2GridNavigator', () => {
  describe('getNextCell', () => {
    it('creates a new row and targets name column when pressing Enter on the last row (name column)', () => {
      const res = PosV2GridNavigator.getNextCell(0, 'name', 1);
      expect(res.action).toBe('create_row');
      expect(res.targetRowIndex).toBe(1);
      expect(res.targetColName).toBe('name');
    });

    it('creates a new row and targets name column when pressing Enter on the last row (quantity column)', () => {
      const res = PosV2GridNavigator.getNextCell(2, 'quantity', 3);
      expect(res.action).toBe('create_row');
      expect(res.targetRowIndex).toBe(3);
      expect(res.targetColName).toBe('name');
    });

    it('creates a new row and targets name column when pressing Enter on the last row (unitPrice column)', () => {
      const res = PosV2GridNavigator.getNextCell(2, 'unitPrice', 3);
      expect(res.action).toBe('create_row');
      expect(res.targetRowIndex).toBe(3);
      expect(res.targetColName).toBe('name');
    });

    it('navigates to next row in the same column when not on the last row', () => {
      const resName = PosV2GridNavigator.getNextCell(0, 'name', 3);
      expect(resName.action).toBe('focus_cell');
      expect(resName.targetRowIndex).toBe(1);
      expect(resName.targetColName).toBe('name');

      const resQty = PosV2GridNavigator.getNextCell(1, 'quantity', 3);
      expect(resQty.action).toBe('focus_cell');
      expect(resQty.targetRowIndex).toBe(2);
      expect(resQty.targetColName).toBe('quantity');

      const resPrice = PosV2GridNavigator.getNextCell(0, 'unitPrice', 3);
      expect(resPrice.action).toBe('focus_cell');
      expect(resPrice.targetRowIndex).toBe(1);
      expect(resPrice.targetColName).toBe('unitPrice');
    });
  });

  describe('getNextMenuIndex', () => {
    it('returns 0 when pressing down with no item currently selected (-1)', () => {
      expect(PosV2GridNavigator.getNextMenuIndex(-1, 'down', 5)).toBe(0);
    });

    it('increments index when pressing down until reaching the last match', () => {
      expect(PosV2GridNavigator.getNextMenuIndex(0, 'down', 3)).toBe(1);
      expect(PosV2GridNavigator.getNextMenuIndex(1, 'down', 3)).toBe(2);
      expect(PosV2GridNavigator.getNextMenuIndex(2, 'down', 3)).toBe(2);
    });

    it('decrements index when pressing up and unselects (-1) from index 0', () => {
      expect(PosV2GridNavigator.getNextMenuIndex(2, 'up', 3)).toBe(1);
      expect(PosV2GridNavigator.getNextMenuIndex(1, 'up', 3)).toBe(0);
      expect(PosV2GridNavigator.getNextMenuIndex(0, 'up', 3)).toBe(-1);
      expect(PosV2GridNavigator.getNextMenuIndex(-1, 'up', 3)).toBe(-1);
    });

    it('returns -1 if total matches is 0', () => {
      expect(PosV2GridNavigator.getNextMenuIndex(-1, 'down', 0)).toBe(-1);
      expect(PosV2GridNavigator.getNextMenuIndex(0, 'down', 0)).toBe(-1);
    });
  });

  describe('calculateScrollTop', () => {
    it('returns unchanged scrollTop when item is already in view', () => {
      // Container height 200, current scroll 0, item from 50 to 95
      const scroll = PosV2GridNavigator.calculateScrollTop(50, 45, 0, 200);
      expect(scroll).toBe(0);
    });

    it('scrolls down when item bottom exceeds the container visible area', () => {
      // Container height 200, current scroll 0, item from 225 to 270
      const scroll = PosV2GridNavigator.calculateScrollTop(225, 45, 0, 200);
      // itemBottom (270) - containerHeight (200) = 70
      expect(scroll).toBe(70);
    });

    it('scrolls up when item top is above the current scroll position', () => {
      // Container height 200, current scroll 100, item from 40 to 85
      const scroll = PosV2GridNavigator.calculateScrollTop(40, 45, 100, 200);
      expect(scroll).toBe(40);
    });
  });

  describe('getNextTabCell', () => {
    it('focuses the name cell of the next row if there is a row below', () => {
      const res = PosV2GridNavigator.getNextTabCell(0, 3);
      expect(res.action).toBe('focus_cell');
      expect(res.targetRowIndex).toBe(1);
      expect(res.targetColName).toBe('name');
    });

    it('stays on the unitPrice cell if on the last row so focus is not lost', () => {
      const res = PosV2GridNavigator.getNextTabCell(2, 3);
      expect(res.action).toBe('stay');
      expect(res.targetRowIndex).toBe(2);
      expect(res.targetColName).toBe('unitPrice');
    });
  });
});
