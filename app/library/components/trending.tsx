import { HardcoverBook } from '@/lib/hardcover';
import { BookGrid } from './book-grid';

export const Trending = ({
  trending,
  favoritedIds,
  handleFavoriteChange,
  shelfIds,
  handleShelfChange,
}: {
  trending: HardcoverBook[];
  favoritedIds: Set<string>;
  handleFavoriteChange: (bookId: string, favorited: boolean) => void;
  shelfIds: Set<string>;
  handleShelfChange: (bookId: string, onShelf: boolean) => void;
}) => {
  return (
    <section className='flex flex-col gap-sm'>
      <BookGrid
        title='Trending'
        books={trending}
        favoritedIds={favoritedIds}
        onFavoriteChange={handleFavoriteChange}
        shelfIds={shelfIds}
        onShelfChange={handleShelfChange}
      />
    </section>
  );
};
