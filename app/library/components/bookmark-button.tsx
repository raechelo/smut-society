'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleFavorite } from '@/lib/actions/books';
import { toast } from 'sonner';

type Props = {
  bookId: string;
  isFavorited?: boolean;
  onFavoriteChange?: (bookId: string, favorited: boolean) => void;
};

export function BookmarkButton({ bookId, isFavorited = false, onFavoriteChange }: Props) {
  const { status } = useSession();
  const [favorited, setFavorited] = useState(isFavorited);

  if (status !== 'authenticated') return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await toggleFavorite(bookId);
      setFavorited(res.favorited);
      onFavoriteChange?.(bookId, res.favorited);
      toast.success(res.favorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      setFavorited(!next);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg);
    }
  };

  return (
    // drop-shadow traces the clip-path outline, acting as the ink border
    <div
      className='absolute top-0 right-3 z-10'
      style={{ filter: 'drop-shadow(0 1px 1px var(--color-ink))' }}
    >
      <button
        onClick={handleClick}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)' }}
        className='flex h-12 w-9 cursor-pointer items-center justify-center pb-4 bg-primary transition-colors duration-150 hover:bg-primary-dark'
      >
        <Heart className={cn('size-4 text-ink transition-all', favorited && 'fill-ink')} />
      </button>
    </div>
  );
}
