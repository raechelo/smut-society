'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { BookMarked, Heart, Plus, Users } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toggleFavorite, toggleShelf } from '@/lib/actions/books';
import { toast } from 'sonner';
import type { GoogleBook } from '@/lib/types/books';
import { SubmitToPoolDialog } from './submit-to-pool-dialog';

type BookCardActionsProps = {
  book: GoogleBook;
  isFavorited?: boolean;
  onFavoriteChange?: (bookId: string, favorited: boolean) => void;
  isOnShelf?: boolean;
  onShelfChange?: (bookId: string, onShelf: boolean) => void;
};

export function BookCardActions({
  book,
  isFavorited = false,
  onFavoriteChange,
  isOnShelf = false,
  onShelfChange,
}: BookCardActionsProps) {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const [open, setOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const [onShelf, setOnShelf] = useState(isOnShelf);

  const handleShelf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (!isLoggedIn) {
      toast.error('Sign in to add books to your shelf');
      return;
    }
    const next = !onShelf;
    setOnShelf(next);
    try {
      const res = await toggleShelf({
        bookId: book.id,
        bookTitle: book.volumeInfo.title,
        bookCover: book.volumeInfo.imageLinks?.thumbnail?.replace(
          'http://',
          'https://'
        ),
        bookAuthor: book.volumeInfo.authors?.join(', '),
      });
      setOnShelf(res.onShelf);
      onShelfChange?.(book.id, res.onShelf);
      toast.success(
        res.onShelf
          ? 'Added to currently reading'
          : 'Removed from currently reading'
      );
    } catch (err) {
      setOnShelf(!next);
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await toggleFavorite(book.id);
      setFavorited(res.favorited);
      onFavoriteChange?.(book.id, res.favorited);
      toast.success(
        res.favorited ? 'Added to favorites' : 'Removed from favorites'
      );
    } catch (err) {
      setFavorited(!next);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg === 'Unauthorized' ? 'Sign in to save favorites' : msg);
    }
  };

  const handleSubmitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (!isLoggedIn) {
      toast.error('Sign in to suggest books to your clubs');
      return;
    }
    setPoolOpen(true);
  };

  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        {/* Bookmark ribbon trigger. drop-shadow traces the clip-path as an ink border. */}
        <div
          className='absolute top-0 right-3 z-10'
          style={{ filter: 'drop-shadow(0 1px 1px var(--color-ink))' }}
        >
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label='Book actions'
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)',
              }}
              className='flex h-12 w-9 cursor-pointer items-center justify-center pb-4 bg-primary text-parchment transition-colors duration-150 hover:bg-primary-dark'
            >
              <Plus className='size-4' />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className='w-52 p-1'
          align='end'
          sideOffset={6}
        >
          <div className='flex flex-col gap-0.5'>
            {isLoggedIn && (
              <button
                onClick={handleFavorite}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all duration-100 hover:bg-primary/10 hover:text-primary active:scale-[0.98]',
                  favorited && 'text-accent hover:bg-accent/10 hover:text-accent'
                )}
              >
                <Heart
                  className={cn('size-4 shrink-0', favorited && 'fill-current')}
                />
                {favorited ? 'Remove from favorites' : 'Add to favorites'}
              </button>
            )}

            {isLoggedIn && (
              <button
                onClick={handleShelf}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all duration-100 hover:bg-primary/10 hover:text-primary active:scale-[0.98]',
                  onShelf && 'text-accent hover:bg-accent/10 hover:text-accent'
                )}
              >
                <BookMarked
                  className={cn('size-4 shrink-0', onShelf && 'fill-current')}
                />
                {onShelf ? 'On your shelf' : 'Add to currently reading'}
              </button>
            )}

            <button
              onClick={handleSubmitClick}
              className='flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all duration-100 hover:bg-primary/10 hover:text-primary active:scale-[0.98]'
            >
              <Users className='size-4 shrink-0' />
              Submit to pool…
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <SubmitToPoolDialog
        book={book}
        open={poolOpen}
        onOpenChange={setPoolOpen}
      />
    </>
  );
}
