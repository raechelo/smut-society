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
  { label: '<200 pages', value: 'short' },
  { label: '200–400 pages', value: 'medium' },
  { label: '400+ pages', value: 'long' },
];

export function matchesLength(
  pageCount: number | undefined,
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

const RELEVANT_CATEGORY_KEYWORDS = [
  'fiction',
  'romance',
  'erotica',
  'fantasy',
  'mystery',
  'thriller',
  'horror',
  'drama',
  'literary',
  'comic',
  'graphic novel',
];

export function isRelevantBook(book: GoogleBook): boolean {
  const cats = book.volumeInfo.categories;
  if (!cats?.length) return true;
  const lower = cats.map((c) => c.toLowerCase());
  return lower.some((c) => RELEVANT_CATEGORY_KEYWORDS.some((kw) => c.includes(kw)));
}

export type GoogleBook = {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    categories?: string[];
    publishedDate?: string;
    pageCount?: number;
    averageRating?: number;
    ratingsCount?: number;
  };
};
