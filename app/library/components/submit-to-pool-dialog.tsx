'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUserClubs, nominateBook } from '@/lib/actions/books';
import type { GoogleBook } from '@/lib/types/books';

type Club = { id: string; name: string };

export function SubmitToPoolDialog({
  book,
  open,
  onOpenChange,
}: {
  book: GoogleBook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Load the user's clubs the first time the dialog opens.
  useEffect(() => {
    if (!open || clubs !== null) return;
    let cancelled = false;
    getUserClubs()
      .then((result) => {
        if (!cancelled) setClubs(result);
      })
      .catch(() => {
        if (!cancelled) setClubs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clubs]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    const { title, authors, imageLinks } = book.volumeInfo;
    setSubmitting(true);
    try {
      await Promise.all(
        [...selected].map((clubId) =>
          nominateBook(clubId, {
            bookId: book.id,
            bookTitle: title,
            bookCover: imageLinks?.thumbnail?.replace('http://', 'https://'),
            bookAuthor: authors?.join(', '),
          })
        )
      );
      toast.success(
        selected.size === 1
          ? 'Submitted to the pool'
          : `Submitted to ${selected.size} clubs`
      );
      onOpenChange(false);
      setSelected(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not submit the book'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className='flex flex-col gap-4'>
      {clubs === null ? (
        <div className='flex items-center justify-center py-6 text-muted-foreground'>
          <Loader2 className='size-5 animate-spin' />
        </div>
      ) : clubs.length === 0 ? (
        <p className='py-4 text-center text-sm text-muted-foreground'>
          You haven’t joined any book clubs yet.
        </p>
      ) : (
        <ul className='flex flex-col gap-1'>
          {clubs.map((club) => {
            const checked = selected.has(club.id);
            return (
              <li key={club.id}>
                <button
                  type='button'
                  onClick={() => toggle(club.id)}
                  aria-pressed={checked}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    checked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:border-primary/50'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-[5px] border',
                      checked
                        ? 'border-primary bg-primary text-parchment'
                        : 'border-border'
                    )}
                  >
                    {checked && <Check className='size-3.5' />}
                  </span>
                  <span className='min-w-0 truncate font-medium'>
                    {club.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {clubs && clubs.length > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
        >
          {submitting && <Loader2 className='size-4 animate-spin' />}
          {selected.size > 1
            ? `Submit to ${selected.size} clubs`
            : 'Submit to pool'}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={<span className='hidden' />}
      title='Submit to a club pool'
      description={`Suggest “${book.volumeInfo.title}” for your clubs’ next read.`}
      content={content}
    />
  );
}
