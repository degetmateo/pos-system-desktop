import { describe, it, expect } from 'vitest';
import { RelevanceSearchRanker } from '../../src/public/services/relevance-search.ranker';

describe('RelevanceSearchRanker', () => {
  interface SampleItem {
    id: string;
    name: string;
    code?: string;
  }

  const items: SampleItem[] = [
    { id: '1', name: 'Cuaderno Gloria Rayado Tapa Dura', code: 'GLO-01' },
    { id: '2', name: 'Cuaderno Rivadavia Rayado', code: 'RIV-02' },
    { id: '3', name: 'Lapicera Gloria Azul', code: 'GLO-03' },
    { id: '4', name: 'Goma Blanca', code: 'GOM-04' },
  ];

  it('returns all items when query is empty', () => {
    const result = RelevanceSearchRanker.rank(items, '', (i) => [i.name, i.code]);
    expect(result).toHaveLength(4);
  });

  it('ranks items matching more independent query terms higher', () => {
    // Query: "cuaderno gloria rayado"
    // Item 1 matches: cuaderno, gloria, rayado (3)
    // Item 2 matches: cuaderno, rayado (2)
    // Item 3 matches: gloria (1)
    // Item 4 matches: 0
    const result = RelevanceSearchRanker.rank(items, 'cuaderno gloria rayado', (i) => [i.name, i.code]);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(result[2].id).toBe('3');
  });

  it('gives priority to exact phrase matches and prefixes', () => {
    const candidates: SampleItem[] = [
      { id: 'a', name: 'Papel Fotográfico Brillante' },
      { id: 'b', name: 'Brillante Papel Fotográfico' },
    ];
    const result = RelevanceSearchRanker.rank(candidates, 'papel fotográfico', (i) => [i.name]);
    expect(result[0].id).toBe('a');
  });
});

