export interface SearchRelevanceResult {
  hasSearch: boolean;
  whereClause: string;
  scoreSelect: string;
  whereParams: unknown[];
  scoreParams: unknown[];
  orderClause: (baseOrderBy: string) => string;
}

export class SqliteSearchRelevanceBuilder {
  public static build(searchTerm: string | undefined | null, fields: string[]): SearchRelevanceResult {
    const raw = (searchTerm || '').trim();
    if (!raw || fields.length === 0) {
      return {
        hasSearch: false,
        whereClause: '',
        scoreSelect: '',
        whereParams: [],
        scoreParams: [],
        orderClause: (base) => base,
      };
    }

    const words = raw.split(/\s+/).filter(Boolean);
    const wordConditions: string[] = [];
    const singleWordParams: unknown[] = [];

    for (const w of words) {
      const fieldChecks = fields.map((f) => `${f} LIKE ? COLLATE NOCASE`);
      wordConditions.push(`(${fieldChecks.join(' OR ')})`);
      for (let i = 0; i < fields.length; i++) {
        singleWordParams.push(`%${w}%`);
      }
    }

    const whereClause = `(${wordConditions.join(' OR ')})`;
    const whereParams = [...singleWordParams];

    const scoreExprParts = [...wordConditions];
    const scoreParams = [...singleWordParams];

    if (words.length > 1) {
      scoreExprParts.push(`(( ${fields[0]} LIKE ? COLLATE NOCASE ) * 5)`);
      scoreParams.push(`%${raw}%`);
    }

    const scoreSelect = `(${scoreExprParts.join(' + ')}) AS match_score`;

    return {
      hasSearch: true,
      whereClause,
      scoreSelect,
      whereParams,
      scoreParams,
      orderClause: (baseOrderBy: string) => {
        const cleanBase = baseOrderBy.replace(/^ORDER BY\s+/i, '').trim();
        return cleanBase ? `ORDER BY match_score DESC, ${cleanBase}` : 'ORDER BY match_score DESC';
      },
    };
  }
}

