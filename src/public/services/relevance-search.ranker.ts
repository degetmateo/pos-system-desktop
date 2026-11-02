export class RelevanceSearchRanker {
  public static rank<T>(
    items: T[],
    query: string,
    fieldExtractor: (item: T) => (string | null | undefined)[]
  ): T[] {
    const raw = (query || '').trim().toLowerCase();
    if (!raw) return items;

    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 0) return items;

    const scoredItems: { item: T; score: number }[] = [];

    for (const item of items) {
      const fieldValues = fieldExtractor(item)
        .filter((val): val is string => typeof val === 'string' && val.length > 0)
        .map((val) => val.toLowerCase());

      let matches = 0;
      for (const w of words) {
        if (fieldValues.some((f) => f.includes(w))) {
          matches++;
        }
      }

      if (matches > 0) {
        let score = matches * 10;
        if (fieldValues.some((f) => f.includes(raw))) {
          score += 25;
        }
        if (fieldValues.length > 0 && fieldValues[0].startsWith(words[0])) {
          score += 15;
        }
        scoredItems.push({ item, score });
      }
    }

    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.map((s) => s.item);
  }
}

