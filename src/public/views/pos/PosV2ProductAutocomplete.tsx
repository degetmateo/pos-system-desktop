import React, { useEffect, useRef } from 'react';
import { ProductDto } from '../../types/api.types';
import { PosV2GridNavigator } from './PosV2GridNavigator';

interface PosV2ProductAutocompleteProps {
  matches: ProductDto[];
  isOpen: boolean;
  selectedIndex: number;
  loading: boolean;
  onSelect: (product: ProductDto) => void;
  onHover: (index: number) => void;
}

export const PosV2ProductAutocomplete: React.FC<PosV2ProductAutocompleteProps> = ({
  matches,
  isOpen,
  selectedIndex,
  loading,
  onSelect,
  onHover,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const container = listRef.current;
      const item = itemRefs.current[selectedIndex];
      if (item) {
        container.scrollTop = PosV2GridNavigator.calculateScrollTop(
          item.offsetTop,
          item.offsetHeight,
          container.scrollTop,
          container.clientHeight
        );
      }
    } else if (selectedIndex === -1 && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [selectedIndex]);

  if (!isOpen || (!loading && matches.length === 0)) return null;

  return (
    <div
      ref={listRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        width: '100%',
        minWidth: '280px',
        maxHeight: '220px',
        overflowY: 'auto',
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {loading && (
        <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Buscando productos...
        </div>
      )}
      {matches.map((p, index) => {
        const isSelected = index === selectedIndex;
        const minor = typeof p.priceMinor === 'object' && p.priceMinor !== null
          ? (p.priceMinor as { cents: number }).cents : (p.priceMinor || 0);
        const major = typeof p.priceMajor === 'object' && p.priceMajor !== null
          ? (p.priceMajor as { cents: number }).cents : (p.priceMajor || 0);

        return (
          <div
            key={p.id}
            ref={(el) => { itemRefs.current[index] = el; }}
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
              borderLeft: isSelected ? '3px solid var(--brand-celeste)' : '3px solid transparent',
            }}
            onClick={() => onSelect(p)}
            onMouseEnter={() => onHover(index)}
          >
            <div>
              <div style={{ fontWeight: 600, color: isSelected ? '#0369a1' : 'var(--brand-dark)' }}>{p.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.barcode || 'Sin código'}</div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 700, color: '#0369a1' }}>
              ${(minor / 100).toFixed(2)}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                May: ${(major / 100).toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
