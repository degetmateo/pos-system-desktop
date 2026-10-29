import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
}) => {
  if (totalPages <= 1 && totalItems <= 15) return null;

  const pages: number[] = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '16px', padding: '10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
      <div>
        Página <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{totalPages || 1}</strong>
        {' '}(Total: <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong>)
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 10px' }}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', minWidth: '34px', fontWeight: p === page ? 700 : 500 }}
            disabled={disabled}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 10px' }}
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

