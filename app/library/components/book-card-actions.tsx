'use client';

import { useState } from 'react';
import { Heart, BookOpen, Plus, Star, ChevronRight, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getUserClubs,
  nominateBook,
  toggleFavorite,
} from '@/lib/actions/books';
import type { GoogleBook } from '@/lib/types/books';

type Club = { id: string; name: string };

type State = 'idle' | 'loading-clubs' | 'nominating';

export function BookCardActions({ book }: { book: GoogleBook }) {
  const [open, setOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [clubsExpanded, setClubsExpanded] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [nominatedClubs, setNominatedClubs] = useState<Set<string>>(new Set());

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorited((f) => !f);
    try {
      const res = await toggleFavorite(book.id);
      setFavorited(res.favorited);
    } catch {
      setFavorited((f) => !f);
    }
  };

  const handleClubsToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clubsExpanded && clubs === null) {
      setState('loading-clubs');
      const result = await getUserClubs();
      setClubs(result);
      setState('idle');
    }
    setClubsExpanded((v) => !v);
  };

  const handleNominate = async (clubId: string) => {
    const { title, authors, imageLinks } = book.volumeInfo;
    setState('nominating');
    try {
      await nominateBook(clubId, {
        bookId: book.id,
        bookTitle: title,
        bookCover: imageLinks?.thumbnail?.replace('http://', 'https://'),
        bookAuthor: authors?.join(', '),
      });
      setNominatedClubs((s) => new Set(s).add(clubId));
    } finally {
      setState('idle');
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setClubsExpanded(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size='icon'
          variant='ghost'
          className='absolute top-2 right-2 z-10 size-7 rounded-full bg-primary text-parchment opacity-0 shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-all duration-150 group-hover/card:opacity-100 hover:scale-110 hover:shadow-[0_4px_14px_rgba(0,0,0,0.55)]'
          onClick={(e) => e.stopPropagation()}
          aria-label='Book actions'
        >
          <Plus className='size-3.5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-48 p-1'
        align='end'
        sideOffset={6}
      >
        <div className='flex flex-col gap-0.5'>
          {/* Favorite */}
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
            {favorited ? 'Unfavorite' : 'Favorite'}
          </button>

          {/* Club pool */}
          <div>
            <button
              onClick={handleClubsToggle}
              className='flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all duration-100 hover:bg-primary/10 hover:text-primary active:scale-[0.98]'
            >
              {state === 'loading-clubs' ? (
                <Loader2 className='size-4 shrink-0 animate-spin' />
              ) : (
                <BookOpen className='size-4 shrink-0' />
              )}
              Add to club pool
              <ChevronRight
                className={cn(
                  'ml-auto size-3 shrink-0 transition-transform',
                  clubsExpanded && 'rotate-90'
                )}
              />
            </button>

            {clubsExpanded && (
              <div className='ml-2 flex flex-col border-l border-border/40 pl-2 pb-0.5'>
                {clubs?.length === 0 ? (
                  <p className='px-1 py-1 text-xs text-muted-foreground'>
                    No clubs joined
                  </p>
                ) : (
                  clubs?.map((club) => (
                    <button
                      key={club.id}
                      disabled={nominatedClubs.has(club.id) || state === 'nominating'}
                      onClick={() => handleNominate(club.id)}
                      className={cn(
                        'rounded-sm px-1 py-1 text-left text-xs transition-all duration-100 hover:bg-primary/10 hover:text-primary active:scale-[0.98]',
                        nominatedClubs.has(club.id) &&
                          'text-muted-foreground cursor-default hover:bg-transparent hover:text-muted-foreground'
                      )}
                    >
                      {nominatedClubs.has(club.id) ? '✓ ' : ''}
                      {club.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className='my-0.5 h-px bg-border/40' />

          {/* Rate — placeholder */}
          <button
            disabled
            className='flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed'
          >
            <Star className='size-4 shrink-0' />
            Rate
            <span className='ml-auto text-[10px]'>soon</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
