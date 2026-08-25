'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Input } from '@/components/ui/input';

const SIZE = 5;
const CELLS = SIZE * SIZE;
// The classic bingo "free" space — shown as placeholder text the user can type
// over if they'd rather put their own prediction there.
const CENTER = Math.floor(CELLS / 2);
const MAX_FONT = 20;
const MIN_FONT = 9;

// useLayoutEffect measures the DOM, but React warns when it runs during SSR.
// This client component still server-renders once, so fall back to useEffect
// on the server.
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// A single square: a textarea that shrinks its font until the text fits the
// fixed cell, then sizes to its content so the flex-centered cell keeps the
// text — and the "FREE" placeholder — vertically and horizontally centered.
function BingoSquare({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [box, setBox] = useState<{ fontSize: number; height: number | 'auto' }>(
    { fontSize: MAX_FONT, height: 'auto' }
  );

  const fit = useCallback(() => {
    const el = ref.current;
    const cell = el?.parentElement;
    if (!el || !cell) return;
    const availH = cell.clientHeight;
    const availW = cell.clientWidth;

    let size = MAX_FONT;
    el.style.fontSize = `${size}px`;
    el.style.height = 'auto';
    // Start from the largest size and step down until the content fits the cell
    // both vertically and horizontally. Starting from MAX each time lets the
    // font grow back when text is deleted.
    while (
      size > MIN_FONT &&
      (el.scrollHeight > availH || el.scrollWidth > availW)
    ) {
      size -= 1;
      el.style.fontSize = `${size}px`;
      el.style.height = 'auto';
    }
    // Collapse the textarea to exactly its content height so the flex cell can
    // center it vertically.
    setBox({ fontSize: size, height: el.scrollHeight });
  }, []);

  useIsoLayoutEffect(() => {
    fit();
  }, [value, fit]);

  // Re-fit whenever the cell is resized (responsive layout, window resize).
  // Observe the cell, not the textarea — the textarea's own height changes here,
  // and observing it would loop.
  useEffect(() => {
    const cell = ref.current?.parentElement;
    if (!cell || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(cell);
    return () => observer.disconnect();
  }, [fit]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      aria-label='Bingo prediction'
      className='w-full resize-none overflow-hidden break-words bg-transparent p-1.5 text-center font-medium leading-tight text-foreground outline-none placeholder:text-muted-foreground/40'
      style={{ fontSize: box.fontSize, height: box.height }}
    />
  );
}

export function BingoCard() {
  const [title, setTitle] = useState('');
  const [cells, setCells] = useState<string[]>(() => Array(CELLS).fill(''));

  const setCell = useCallback((index: number, value: string) => {
    setCells((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  return (
    <div className='flex w-full max-w-[640px] flex-col items-center gap-md'>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Card title — e.g. Fourth Wing predictions'
        className='text-center'
      />

      <div className='grid aspect-square w-full grid-cols-5 grid-rows-5 gap-1.5 rounded-lg border border-accent-light bg-card p-1.5 shadow-sm'>
        {cells.map((value, index) => (
          <div
            key={index}
            className='flex items-center justify-center overflow-hidden rounded-md border border-border bg-parchment/40 transition-colors hover:border-accent/60 focus-within:border-accent focus-within:bg-parchment'
          >
            <BingoSquare
              value={value}
              onChange={(next) => setCell(index, next)}
              placeholder={index === CENTER ? 'FREE' : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
