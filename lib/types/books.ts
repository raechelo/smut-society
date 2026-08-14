export type SortOrder = 'relevance' | 'newest';
export type LengthFilter = 'short' | 'medium' | 'long';

export type BookFilters = {
  genres: string[];
  lengths: LengthFilter[];
  sortBy: SortOrder;
};

export const DEFAULT_FILTERS: BookFilters = {
  genres: [],
  lengths: [],
  sortBy: 'relevance',
};

export const GENRES = [
  { label: 'Romance', value: 'romance' },
  { label: 'Fantasy', value: 'fantasy' },
  { label: 'Historical', value: 'historical fiction' },
  { label: 'Mystery', value: 'mystery' },
  { label: 'Thriller', value: 'thriller' },
  { label: 'Contemporary', value: 'contemporary fiction' },
  { label: 'Paranormal', value: 'paranormal romance' },
  { label: 'Dark Romance', value: 'dark romance' },
  { label: 'Sci-Fi', value: 'science fiction' },
  { label: 'Gothic', value: 'gothic fiction' },
] as const;

export const LENGTH_OPTIONS: { label: string; value: LengthFilter }[] = [
  { label: 'Short', value: 'short' },
  { label: 'Medium', value: 'medium' },
  { label: 'Long', value: 'long' },
];

export function matchesLength(
  pageCount: number | null | undefined,
  lengths: LengthFilter[]
): boolean {
  if (!lengths.length) return true;
  if (!pageCount) return false;
  return lengths.some((l) => {
    if (l === 'short') return pageCount < 200;
    if (l === 'medium') return pageCount >= 200 && pageCount <= 400;
    return pageCount > 400;
  });
}
