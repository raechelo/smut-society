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
import { Button } from '@/components/ui/button';
import { toggleFavorite, toggleShelf } from '@/lib/actions/books';
import { toast } from 'sonner';
import type { HardcoverBook } from '@/lib/hardcover';
import { SubmitToPoolDialog } from './submit-to-pool-dialog';

// Popover menu rows: full-width, left-aligned, and readable (not the Button's
// default uppercase) since this is a menu, not a standalone action.
const MENU_ITEM =
  'w-full justify-start gap-2 rounded-sm px-2 text-sm font-normal normal-case tracking-normal hover:bg-primary/10 hover:text-primary';

type BookCardActionsProps = {
  book: HardcoverBook;
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
        bookId: book.slug,
        bookTitle: book.title,
        bookCover: book.cover ?? undefined,
        bookAuthor: book.authors.join(', ') || undefined,
      });
      setOnShelf(res.onShelf);
      onShelfChange?.(book.slug, res.onShelf);
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
      const res = await toggleFavorite(book.slug);
      setFavorited(res.favorited);
      onFavoriteChange?.(book.slug, res.favorited);
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
            <Button
              onClick={(e) => e.stopPropagation()}
              aria-label='Book actions'
              size='icon-sm'
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)',
              }}
              className='h-12 rounded-none pb-4'
            >
              <Plus className='size-4' />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className='w-52 p-1'
          align='end'
          sideOffset={6}
        >
          <div className='flex flex-col gap-0.5'>
            {isLoggedIn && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleFavorite}
                className={cn(
                  MENU_ITEM,
                  favorited && 'text-accent hover:bg-accent/10 hover:text-accent'
                )}
              >
                <Heart
                  className={cn('size-4 shrink-0', favorited && 'fill-current')}
                />
                {favorited ? 'Remove from favorites' : 'Add to favorites'}
              </Button>
            )}

            {isLoggedIn && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleShelf}
                className={cn(
                  MENU_ITEM,
                  onShelf && 'text-accent hover:bg-accent/10 hover:text-accent'
                )}
              >
                <BookMarked
                  className={cn('size-4 shrink-0', onShelf && 'fill-current')}
                />
                {onShelf ? 'On your shelf' : 'Add to currently reading'}
              </Button>
            )}

            <Button
              variant='ghost'
              size='sm'
              onClick={handleSubmitClick}
              className={MENU_ITEM}
            >
              <Users className='size-4 shrink-0' />
              Submit to pool…
            </Button>
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
