'use client';

import { useCallback, useEffect, useState } from 'react';
import { Delete, CornerDownLeft, Lightbulb } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  submitBookdleGuess,
  getBookdleHint,
  type BookdleState,
  type BookdleReveal,
  type BookdleStatus,
  type GuessResult,
  type LetterStatus,
} from '@/lib/actions/bookdle';

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const STATUS_RANK: Record<LetterStatus, number> = {
  absent: 1,
  present: 2,
  correct: 3,
};

const tileColor: Record<LetterStatus, string> = {
  correct: 'border-transparent bg-[#6aaa64] text-white',
  present: 'border-transparent bg-accent text-accent-foreground',
  absent: 'border-transparent bg-foreground/25 text-background',
};

function Tile({
  letter,
  status,
  filled,
}: {
  letter: string;
  status?: LetterStatus;
  filled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex aspect-square w-full items-center justify-center rounded-md border-2 text-3xl font-bold uppercase sm:text-4xl',
        status
          ? tileColor[status]
          : filled
            ? 'border-foreground/40'
            : 'border-border'
      )}
    >
      {letter}
    </div>
  );
}

export function BookdleBoard({ initial }: { initial: BookdleState }) {
  const { length, maxTries, signedIn } = initial;
  const [guesses, setGuesses] = useState<GuessResult[]>(initial.guesses);
  const [status, setStatus] = useState<BookdleStatus>(initial.status);
  const [reveal, setReveal] = useState<BookdleReveal | null>(initial.reveal);
  const [current, setCurrent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const revealHint = useCallback(async () => {
    if (hint || hintLoading) return;
    setHintLoading(true);
    try {
      const { hint: h } = await getBookdleHint();
      setHint(h ?? "No hint available for today's word.");
    } catch {
      toast.error('Could not load a hint');
    } finally {
      setHintLoading(false);
    }
  }, [hint, hintLoading]);

  // Best-known status per letter, for keyboard coloring.
  const letterStatus = new Map<string, LetterStatus>();
  for (const guess of guesses) {
    for (const { letter, status: s } of guess) {
      const existing = letterStatus.get(letter);
      if (!existing || STATUS_RANK[s] > STATUS_RANK[existing]) {
        letterStatus.set(letter, s);
      }
    }
  }

  const submit = useCallback(async () => {
    if (current.length !== length) {
      toast.error(`Not enough letters — need ${length}`);
      return;
    }
    setSubmitting(true);
    try {
      const outcome = await submitBookdleGuess(current);
      setGuesses((g) => [...g, outcome.result]);
      setCurrent('');
      setStatus(outcome.status);
      if (outcome.reveal) setReveal(outcome.reveal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit guess');
    } finally {
      setSubmitting(false);
    }
  }, [current, length]);

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing' || submitting || !signedIn) return;
      if (key === 'ENTER') submit();
      else if (key === 'BACKSPACE') setCurrent((c) => c.slice(0, -1));
      else if (/^[A-Z]$/.test(key)) {
        setCurrent((c) => (c.length < length ? c + key : c));
      }
    },
    [status, submitting, signedIn, submit, length]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACKSPACE');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  // Cap tile size but let the row shrink on narrow screens (no horizontal scroll).
  const boardStyle = {
    gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`,
    maxWidth: `${length * 4.25}rem`,
  };

  return (
    <div className='flex w-full flex-col items-center gap-lg'>
      <div className='flex flex-col items-center gap-1 text-center'>
        <Typography
          variant='h2'
          display
          classNames='!mb-0 text-primary'
        >
          Bookdle
        </Typography>
        <Typography
          variant='p2'
          color='muted'
        >
          Guess today&apos;s word in {maxTries} tries · {length} letters
        </Typography>
      </div>

      {/* Board */}
      <div className='flex w-full flex-col items-center gap-1.5'>
        {Array.from({ length: maxTries }).map((_, row) => {
          const guess = guesses[row];
          const isCurrentRow = row === guesses.length && status === 'playing';
          return (
            <div
              key={row}
              className='grid w-full gap-1.5'
              style={boardStyle}
            >
              {Array.from({ length }).map((_, col) => {
                if (guess) {
                  return (
                    <Tile
                      key={col}
                      letter={guess[col].letter}
                      status={guess[col].status}
                    />
                  );
                }
                const letter = isCurrentRow ? (current[col] ?? '') : '';
                return (
                  <Tile
                    key={col}
                    letter={letter}
                    filled={!!letter}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Hint */}
      {status === 'playing' && signedIn && (
        <div className='flex flex-col items-center gap-2'>
          {hint ? (
            <div className='max-w-[420px] rounded-md border border-border bg-foreground/5 px-4 py-3 text-center'>
              <Typography
                variant='span'
                color='muted'
                classNames='text-xs font-semibold uppercase tracking-widest'
              >
                Hint
              </Typography>
              <Typography
                variant='p2'
                classNames='mt-1 italic leading-snug'
              >
                &ldquo;{hint}&rdquo;
              </Typography>
            </div>
          ) : (
            <Button
              variant='outline'
              color='primary'
              size='sm'
              onClick={revealHint}
              disabled={hintLoading}
            >
              <Lightbulb className='size-4' />
              {hintLoading ? 'Loading…' : 'Need a hint?'}
            </Button>
          )}
        </div>
      )}

      {/* Result / reveal */}
      {status !== 'playing' && reveal && (
        <div className='flex flex-col items-center gap-3 text-center'>
          <Typography
            variant='h5'
            display
            classNames='!mb-0 text-primary'
          >
            {status === 'won' ? `Solved in ${guesses.length}!` : 'Out of tries'}
          </Typography>
          <div className='flex items-center gap-3'>
            {reveal.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={reveal.cover}
                alt={reveal.title}
                className='h-24 w-16 shrink-0 rounded-md object-cover shadow-sm'
              />
            ) : null}
            <div className='flex flex-col items-start text-left'>
              <Typography
                variant='p2'
                color='muted'
              >
                The word was
              </Typography>
              <Typography
                variant='h6'
                classNames='font-semibold tracking-wide'
              >
                {reveal.word}
              </Typography>
              <Typography
                variant='p2'
                color='muted'
                classNames='leading-snug'
              >
                from <span className='italic'>{reveal.title}</span>
                {reveal.author ? ` by ${reveal.author}` : ''}
              </Typography>
            </div>
          </div>
          <Typography
            variant='span'
            color='muted'
          >
            Come back tomorrow for a new word.
          </Typography>
        </div>
      )}

      {/* On-screen keyboard */}
      {status === 'playing' &&
        (signedIn ? (
          <div className='flex w-full max-w-[520px] flex-col gap-1.5'>
            {KEY_ROWS.map((rowKeys, i) => (
              <div
                key={i}
                className='flex justify-center gap-1'
              >
                {i === 2 && (
                  <KeyButton
                    wide
                    label={<CornerDownLeft className='size-4' />}
                    ariaLabel='Submit guess'
                    onClick={() => handleKey('ENTER')}
                    disabled={submitting}
                  />
                )}
                {rowKeys.split('').map((key) => (
                  <KeyButton
                    key={key}
                    label={key}
                    status={letterStatus.get(key)}
                    onClick={() => handleKey(key)}
                    disabled={submitting}
                  />
                ))}
                {i === 2 && (
                  <KeyButton
                    wide
                    label={<Delete className='size-4' />}
                    ariaLabel='Backspace'
                    onClick={() => handleKey('BACKSPACE')}
                    disabled={submitting}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center gap-2'>
            <Typography
              variant='p2'
              color='muted'
            >
              Sign in to play today&apos;s Bookdle.
            </Typography>
            <Button onClick={() => signIn('google')}>Sign in</Button>
          </div>
        ))}
    </div>
  );
}

function KeyButton({
  label,
  ariaLabel,
  status,
  wide,
  disabled,
  onClick,
}: {
  label: React.ReactNode;
  ariaLabel?: string;
  status?: LetterStatus;
  wide?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-12 items-center justify-center rounded-md text-sm font-semibold uppercase transition-colors disabled:opacity-60',
        wide ? 'px-3' : 'w-8 sm:w-9',
        status
          ? tileColor[status]
          : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
      )}
    >
      {label}
    </button>
  );
}
