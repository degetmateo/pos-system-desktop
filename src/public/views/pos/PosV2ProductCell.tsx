import React, { useState, useEffect } from 'react';
import { ProductDto } from '../../types/api.types';
import { ApiClient } from '../../services/api.client';
import { PosV2ProductAutocomplete } from './PosV2ProductAutocomplete';
import { PosV2GridNavigator } from './PosV2GridNavigator';

interface PosV2ProductCellProps {
  rowIndex: number;
  value: string;
  onChange: (name: string) => void;
  onSelectProduct: (product: ProductDto) => void;
  onEnterCell: () => void;
  onDropdownStateChange?: (open: boolean) => void;
}

export const PosV2ProductCell: React.FC<PosV2ProductCellProps> = ({
  rowIndex,
  value,
  onChange,
  onSelectProduct,
  onEnterCell,
  onDropdownStateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen || !value.trim()) {
      setMatches([]);
      setSelectedIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await ApiClient.getProducts({ search: value.trim(), limit: 10 });
        setMatches(res);
        setSelectedIndex(-1);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [value, isOpen]);

  const closeDropdown = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
    onDropdownStateChange?.(false);
  };

  const handleSelect = (p: ProductDto) => {
    onSelectProduct(p);
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && matches.length > 0 && isOpen) {
      e.preventDefault();
      setSelectedIndex((prev) => PosV2GridNavigator.getNextMenuIndex(prev, 'down', matches.length));
    } else if (e.key === 'ArrowUp' && matches.length > 0 && isOpen) {
      e.preventDefault();
      setSelectedIndex((prev) => PosV2GridNavigator.getNextMenuIndex(prev, 'up', matches.length));
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeDropdown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && selectedIndex >= 0 && matches[selectedIndex]) {
        handleSelect(matches[selectedIndex]);
      } else {
        closeDropdown();
        onEnterCell();
      }
    } else if (e.key === 'Tab' && isOpen && selectedIndex >= 0 && matches[selectedIndex]) {
      handleSelect(matches[selectedIndex]);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        data-pos-row={rowIndex}
        data-pos-col="name"
        type="text"
        className="input"
        style={{ width: '100%', fontSize: '0.88rem', padding: '6px 8px' }}
        placeholder="Nombre del producto..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          onDropdownStateChange?.(true);
        }}
        onFocus={() => {
          if (value.trim()) {
            setIsOpen(true);
            onDropdownStateChange?.(true);
          }
        }}
        onBlur={() => setTimeout(closeDropdown, 200)}
        onKeyDown={handleKeyDown}
      />
      <PosV2ProductAutocomplete
        matches={matches}
        isOpen={isOpen && matches.length > 0}
        selectedIndex={selectedIndex}
        loading={loading}
        onSelect={handleSelect}
        onHover={setSelectedIndex}
      />
    </div>
  );
};
