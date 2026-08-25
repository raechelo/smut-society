'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Download, Loader2, Lock, Share2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Typography from '@/components/ui/typography';
import { Dialog } from '@/components/app/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  saveBingoCard,
  lockBingoCard,
  type BingoCardData,
  type BingoCell,
} from '@/lib/actions/bingo';
import { ShareToClubDialog } from './share-to-club-dialog';

const SIZE = 5;
const CELLS = SIZE * SIZE;
// The classic bingo "free" space — shown as placeholder text the user can type
// over if they'd rather put their own prediction there.
const CENTER = Math.floor(CELLS / 2);
const MAX_FONT = 20;
const MIN_FONT = 9;

// ─── Share/download rendering ────────────────────────────────────────────────
// The card is rendered to a canvas (rather than a DOM-capture library) so it
// stays dependency-free. Colors and fonts are read from the live elements so
// the exported image matches whatever theme is on screen.

// Break text into lines that fit maxW at the given font size (already set on
// ctx). A single over-long word is kept on its own line; font shrinking below
// handles the overflow.
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(test).width <= maxW) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Largest font (MAX→MIN) at which the wrapped text fits the cell box.
function fitCellText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxH: number,
  fontFamily: string,
  weight = 500
) {
  for (let size = MAX_FONT; size >= MIN_FONT; size--) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lineHeight = size * 1.15;
    const lines = wrapLines(ctx, text, maxW);
    const fits =
      lines.length * lineHeight <= maxH &&
      lines.every((l) => ctx.measureText(l).width <= maxW);
    if (fits) return { lines, size, lineHeight };
  }
  ctx.font = `${weight} ${MIN_FONT}px ${fontFamily}`;
  return {
    lines: wrapLines(ctx, text, maxW),
    size: MIN_FONT,
    lineHeight: MIN_FONT * 1.15,
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
  }
}

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
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // When locked, the text is frozen; clicks fall through to the cell so the
  // whole square acts as a daub target.
  readOnly?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Size the textarea imperatively (font + height set directly on the element)
  // rather than through React state. A state round-trip applies the new height
  // one render behind the text, which leaves the box a line short — so wrapped
  // lines above the caret get clipped until the next keystroke catches up.
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
    // Lock the height to the fully-measured content so every wrapped line is
    // visible and the textarea never scrolls to the caret (which would clip the
    // top line while typing on the last row).
    el.style.height = `${el.scrollHeight}px`;
    el.scrollTop = 0;
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
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      aria-label='Bingo prediction'
      className={cn(
        'w-full resize-none overflow-hidden break-words bg-transparent p-1.5 text-center font-medium leading-tight text-foreground outline-none placeholder:text-muted-foreground/40',
        readOnly && 'pointer-events-none'
      )}
      style={{ fontSize: MAX_FONT }}
    />
  );
}

export function BingoCard({ initial }: { initial: BingoCardData }) {
  const [title, setTitle] = useState(initial.title);
  const [cells, setCells] = useState<BingoCell[]>(initial.cells);
  const [locked, setLocked] = useState(initial.locked);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const gridRef = useRef<HTMLDivElement>(null);

  // Editing text is only allowed before the card is locked.
  const setCellText = useCallback(
    (index: number, text: string) => {
      if (locked) return;
      setCells((prev) => prev.map((c, i) => (i === index ? { ...c, text } : c)));
    },
    [locked]
  );

  // Marking (daubing) is only allowed after the card is locked.
  const toggleMark = useCallback(
    (index: number) => {
      if (!locked) return;
      setCells((prev) =>
        prev.map((c, i) => (i === index ? { ...c, marked: !c.marked } : c))
      );
    },
    [locked]
  );

  const handleLock = useCallback(async () => {
    setLocking(true);
    try {
      // Flush the latest predictions, then freeze the card.
      await saveBingoCard(initial.id, { title, cells });
      await lockBingoCard(initial.id);
      setLocked(true);
      setLockOpen(false);
      toast.success('Card locked — mark squares as they come true');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not lock the card'
      );
    } finally {
      setLocking(false);
    }
  }, [cells, initial.id, title]);

  // Debounced autosave: persist the card a beat after the user stops editing or
  // daubing. Skips the initial mount so opening a card doesn't re-save it.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSaveState('saving');
    const t = setTimeout(() => {
      saveBingoCard(initial.id, { title, cells })
        .then(() => setSaveState('saved'))
        .catch((err) => {
          setSaveState('idle');
          toast.error(
            err instanceof Error ? err.message : 'Could not save the card'
          );
        });
    }, 700);
    return () => clearTimeout(t);
  }, [title, cells, initial.id]);

  const markedCount = cells.filter((c) => c.marked).length;
  const filledCount = cells.filter((c) => c.text.trim()).length;

  // Paint the current card onto a high-res canvas, matching the on-screen theme
  // by reading colors/fonts off the live grid, cell, and textarea elements.
  const buildCanvas = useCallback((): HTMLCanvasElement | null => {
    const gridEl = gridRef.current;
    if (!gridEl) return null;

    const gridStyle = getComputedStyle(gridEl);
    const cardBg = gridStyle.backgroundColor;
    const outerBorder = gridStyle.borderColor;
    const cellEl = gridEl.querySelector('[data-cell]');
    const cellStyle = cellEl ? getComputedStyle(cellEl) : null;
    const cellBg = cellStyle?.backgroundColor || '#ffffff';
    const cellBorder = cellStyle?.borderColor || outerBorder;
    const textareaEl = gridEl.querySelector('textarea');
    const textStyle = textareaEl ? getComputedStyle(textareaEl) : null;
    const textColor = textStyle?.color || '#000000';
    const fontFamily = textStyle?.fontFamily || 'sans-serif';
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const pageBg =
      bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' ? bodyBg : cardBg;

    const scale = 2; // export at 2x for crisp text
    const W = 560;
    const pad = 24;
    const heading = title.trim();
    const titleBlock = heading ? 52 : 16;
    const inner = W - pad * 2;
    const H = pad + titleBlock + inner + pad;

    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Background
    ctx.fillStyle = pageBg;
    ctx.fillRect(0, 0, W, H);

    // Title
    if (heading) {
      ctx.fillStyle = textColor;
      ctx.font = `700 24px ${fontFamily}`;
      ctx.fillText(heading, W / 2, pad + titleBlock / 2, inner);
    }

    // Grid box
    const gridTop = pad + titleBlock;
    ctx.fillStyle = cardBg;
    ctx.strokeStyle = outerBorder;
    ctx.lineWidth = 1.5;
    roundRect(ctx, pad, gridTop, inner, inner, 12);
    ctx.fill();
    ctx.stroke();

    // Cells
    const gp = 8; // inner padding of the grid box
    const gap = 6;
    const area = inner - gp * 2;
    const cell = (area - gap * (SIZE - 1)) / SIZE;
    for (let index = 0; index < CELLS; index++) {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const x = pad + gp + col * (cell + gap);
      const y = gridTop + gp + row * (cell + gap);
      const data = cells[index];
      const marked = !!data?.marked;

      ctx.fillStyle = cellBg;
      ctx.strokeStyle = marked ? outerBorder : cellBorder;
      ctx.lineWidth = marked ? 2 : 1;
      roundRect(ctx, x, y, cell, cell, 6);
      ctx.fill();
      ctx.stroke();

      const raw = data?.text?.trim();
      const isFree = !raw && index === CENTER;
      const text = raw || (isFree ? 'FREE' : '');
      if (text) {
        const maxW = cell - 12;
        const maxH = cell - 12;
        const { lines, size, lineHeight } = fitCellText(
          ctx,
          text,
          maxW,
          maxH,
          fontFamily,
          isFree ? 700 : 500
        );
        ctx.font = `${isFree ? 700 : 500} ${size}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = isFree ? 0.35 : 1;
        const startY = y + cell / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, x + cell / 2, startY + i * lineHeight, maxW);
        });
        ctx.globalAlpha = 1;
      }

      // A big, half-opacity X over daubed squares — drawn last so it sits on
      // top of the text but stays translucent enough to read through.
      if (marked) {
        const m = cell * 0.16; // inset from the cell edges
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = outerBorder;
        ctx.lineWidth = Math.max(3, cell * 0.09);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + m, y + m);
        ctx.lineTo(x + cell - m, y + cell - m);
        ctx.moveTo(x + cell - m, y + m);
        ctx.lineTo(x + m, y + cell - m);
        ctx.stroke();
        ctx.restore();
      }
    }

    return canvas;
  }, [cells, title]);

  const filename = `${
    title.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') ||
    'book-bingo'
  }.png`;

  const handleDownload = useCallback(async () => {
    setMenuOpen(false);
    setDownloading(true);
    try {
      const canvas = buildCanvas();
      if (!canvas) throw new Error('Could not render the card');
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Could not render the card');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Bingo card downloaded');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not download the card'
      );
    } finally {
      setDownloading(false);
    }
  }, [buildCanvas, filename]);

  return (
    <div className='flex w-full max-w-[640px] flex-col items-center gap-md'>
      <div className='flex w-full flex-col items-center gap-1'>
        {locked ? (
          <Typography
            variant='h5'
            classNames='!mb-0 text-center font-semibold'
          >
            {title.trim() || 'Untitled card'}
          </Typography>
        ) : (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Card title — e.g. Fourth Wing predictions'
            className='text-center'
          />
        )}
        <Typography
          variant='span'
          color='muted'
          classNames='text-xs'
        >
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : locked
                ? `${markedCount} of ${CELLS} marked — tap a square as it comes true`
                : `${filledCount} of ${CELLS} filled — lock the card to start marking`}
        </Typography>
      </div>

      <div
        ref={gridRef}
        className='grid aspect-square w-full grid-cols-5 grid-rows-5 gap-1.5 rounded-lg border border-accent-light bg-card p-1.5 shadow-sm'
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            data-cell
            {...(locked
              ? {
                  role: 'button' as const,
                  tabIndex: 0,
                  'aria-pressed': cell.marked,
                  'aria-label': cell.marked
                    ? 'Unmark square'
                    : 'Mark square as complete',
                  onClick: () => toggleMark(index),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleMark(index);
                    }
                  },
                }
              : {})}
            className={cn(
              'relative flex items-center justify-center overflow-hidden rounded-md border transition-colors',
              locked && 'cursor-pointer',
              cell.marked
                ? 'border-accent bg-accent/15'
                : 'border-border bg-parchment/40 hover:border-accent/60 focus-within:border-accent focus-within:bg-parchment'
            )}
          >
            <BingoSquare
              value={cell.text}
              onChange={(next) => setCellText(index, next)}
              placeholder={index === CENTER ? 'FREE' : undefined}
              readOnly={locked}
            />
            {locked && cell.marked && (
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 flex items-center justify-center p-1'
              >
                <X
                  className='size-full text-accent opacity-50'
                  strokeWidth={2}
                />
              </span>
            )}
          </div>
        ))}
      </div>

      <div className='flex items-center gap-2'>
        {!locked && (
          <Dialog
            open={lockOpen}
            onOpenChange={setLockOpen}
            trigger={
              <Button type='button'>
                <Lock className='size-4' />
                Done editing
              </Button>
            }
            title='Lock this card?'
            description='This freezes your predictions so no one can change them — including you. After locking, you can only mark squares as they come true.'
            footer={
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setLockOpen(false)}
                  disabled={locking}
                >
                  Keep editing
                </Button>
                <Button
                  onClick={handleLock}
                  disabled={locking}
                >
                  {locking ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <Lock className='size-4' />
                  )}
                  Lock card
                </Button>
              </div>
            }
          />
        )}

        <Popover
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant={locked ? 'solid' : 'outline'}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <Share2 className='size-4' />
              )}
              Share
            </Button>
          </PopoverTrigger>
        <PopoverContent
          align='center'
          className='w-56 gap-1 p-1'
        >
          <Button
            type='button'
            variant='ghost'
            onClick={handleDownload}
            className='w-full justify-start font-normal normal-case tracking-normal'
          >
            <Download className='size-4' />
            Download
          </Button>
          <Button
            type='button'
            variant='ghost'
            onClick={() => {
              setMenuOpen(false);
              setClubOpen(true);
            }}
            className='w-full justify-start font-normal normal-case tracking-normal'
          >
            <Users className='size-4' />
            Share with bookclub
          </Button>
          </PopoverContent>
        </Popover>
      </div>

      <ShareToClubDialog
        cardId={initial.id}
        cardTitle={title.trim() || undefined}
        open={clubOpen}
        onOpenChange={setClubOpen}
      />
    </div>
  );
}
