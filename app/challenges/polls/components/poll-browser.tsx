'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Chip } from '@/components/app/chip';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  getPollResults,
  voteOnPoll,
  clearPollVote,
  type PollListItem,
  type PollResults,
} from '@/lib/actions/polls';
import { DeletePollButton } from './delete-poll-button';

// Cached results per poll once its accordion has been opened; 'loading' while
// the fetch is in flight, undefined before the first open.
type ResultsState = PollResults | 'loading' | undefined;

// Each answer, rendered as a horizontal bar whose fill width is its share of
// the vote. Clickable (to vote) only when signed in.
function ResultBar({
  text,
  votes,
  total,
  isMine,
  interactive,
  disabled,
  onVote,
}: {
  text: string;
  votes: number;
  total: number;
  isMine: boolean;
  interactive: boolean;
  disabled: boolean;
  onVote: () => void;
}) {
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
  return (
    <button
      type='button'
      disabled={!interactive || disabled}
      onClick={onVote}
      aria-pressed={isMine}
      className={cn(
        'relative w-full overflow-hidden rounded-md border text-left transition-colors',
        isMine ? 'border-accent' : 'border-border',
        interactive
          ? 'hover:border-accent/70 disabled:hover:border-border'
          : 'cursor-default'
      )}
    >
      {/* The fill — its width encodes the vote share. */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 transition-[width] duration-500 ease-out',
          isMine ? 'bg-accent/35' : 'bg-accent/15'
        )}
        style={{ width: `${pct}%` }}
      />
      <div className='relative flex items-center justify-between gap-3 px-3 py-2'>
        <span className='flex min-w-0 items-center gap-1.5'>
          {isMine && <Check className='size-4 shrink-0 text-accent' />}
          <Typography
            variant='p2'
            classNames='truncate'
          >
            {text}
          </Typography>
        </span>
        <Typography
          variant='span'
          classNames='shrink-0 font-semibold tabular-nums'
        >
          {pct}%
        </Typography>
      </div>
    </button>
  );
}

function PollAccordion({
  poll,
  isOwner,
  open,
  results,
  voting,
  onToggle,
  onVote,
  onClear,
}: {
  poll: PollListItem;
  isOwner: boolean;
  open: boolean;
  results: ResultsState;
  voting: boolean;
  onToggle: () => void;
  onVote: (optionId: string) => void;
  onClear: () => void;
}) {
  const panelId = `poll-panel-${poll.id}`;
  const loaded = results && results !== 'loading' ? results : null;
  // Prefer the live total once loaded; fall back to the list's server count.
  const totalVotes = loaded ? loaded.totalVotes : poll.voteCount;
  return (
    <Card
      shadow
      cornerDecoration='diagonal'
      className='gap-0'
    >
      {/* Header — click to expand/collapse. */}
      <button
        type='button'
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className='flex w-full items-start gap-sm text-left'
      >
        <div className='flex min-w-0 flex-1 flex-col gap-sm'>
          <Typography
            variant='h6'
            classNames='font-semibold tracking-wide'
          >
            {poll.title}
          </Typography>
          {poll.description ? (
            <Typography
              variant='p2'
              color='muted'
              classNames={cn('leading-relaxed', !open && 'line-clamp-2')}
            >
              {poll.description}
            </Typography>
          ) : null}
          {poll.tags.length > 0 && (
            <div className='flex flex-wrap gap-xs'>
              {poll.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size='small'
                  variant='painted'
                  colors='accent'
                  className='capitalize'
                />
              ))}
            </div>
          )}
          <Typography
            variant='span'
            color='muted'
          >
            {poll.optionCount} {poll.optionCount === 1 ? 'answer' : 'answers'} ·{' '}
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </Typography>
        </div>
        <ChevronDown
          className={cn(
            'mt-1 size-5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded content — the poll's answers (lazy-loaded on first open). */}
      {open && (
        <div
          id={panelId}
          className='flex flex-col gap-sm pt-md'
        >
          <Separator className='bg-accent-light/30' />
          {!loaded ? (
            <div className='flex items-center gap-2 py-2'>
              <Loader2 className='size-4 animate-spin text-muted-foreground' />
              <Typography
                variant='p2'
                color='muted'
              >
                Loading results…
              </Typography>
            </div>
          ) : (
            <>
              <div className='flex flex-col gap-2'>
                {loaded.options.map((o) => (
                  <ResultBar
                    key={o.id}
                    text={o.text}
                    votes={o.votes}
                    total={loaded.totalVotes}
                    isMine={loaded.myVote === o.id}
                    // Once they've voted, answers lock until they clear it.
                    interactive={loaded.signedIn && !loaded.myVote}
                    disabled={voting}
                    onVote={() => onVote(o.id)}
                  />
                ))}
              </div>

              {/* Status caption (left) + action icon buttons (far right). */}
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  {loaded.signedIn ? (
                    <Typography
                      variant='span'
                      color='muted'
                    >
                      {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                      {loaded.myVote
                        ? ' · you voted'
                        : ' · tap an answer to vote'}
                    </Typography>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <Typography
                        variant='span'
                        color='muted'
                      >
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                      </Typography>
                      <span className='text-muted-foreground'>·</span>
                      <button
                        type='button'
                        onClick={() => signIn('google')}
                        className='text-sm font-semibold text-accent hover:underline'
                      >
                        Sign in to vote
                      </button>
                    </div>
                  )}
                </div>

                <div className='flex shrink-0 items-center gap-1'>
                  {loaded.signedIn && loaded.myVote && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon-sm'
                          aria-label='Clear vote'
                          disabled={voting}
                          onClick={onClear}
                        >
                          {voting ? (
                            <Loader2 className='size-4 animate-spin' />
                          ) : (
                            <RotateCcw className='size-4' />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear vote</TooltipContent>
                    </Tooltip>
                  )}
                  {isOwner && (
                    <>
                      <Link href={`/challenges/polls/edit/${poll.id}`}>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label='Edit poll'
                        >
                          <Pencil className='size-4' />
                        </Button>
                      </Link>
                      <DeletePollButton
                        pollId={poll.id}
                        title={poll.title}
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export function PollBrowser({
  polls,
  currentUserId,
}: {
  polls: PollListItem[];
  currentUserId: string | null;
}) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Multiple polls can be expanded at once.
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [resultsByPoll, setResultsByPoll] = useState<
    Record<string, ResultsState>
  >({});
  // The poll currently having a vote submitted, so its bars disable briefly.
  const [votingId, setVotingId] = useState<string | null>(null);

  const allTags = Array.from(new Set(polls.flatMap((p) => p.tags))).sort();

  const toggleTag = (tag: string) =>
    setSelectedTags((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    );

  const togglePoll = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Lazy-load the poll's results the first time it's opened.
    if (!openIds.has(id) && resultsByPoll[id] === undefined) {
      setResultsByPoll((prev) => ({ ...prev, [id]: 'loading' }));
      getPollResults(id)
        .then((res) =>
          setResultsByPoll((prev) => ({ ...prev, [id]: res }))
        )
        .catch(() =>
          // Reset on failure so a later re-open retries the fetch.
          setResultsByPoll((prev) => ({ ...prev, [id]: undefined }))
        );
    }
  };

  const vote = async (pollId: string, optionId: string) => {
    const current = resultsByPoll[pollId];
    if (!current || current === 'loading' || !current.signedIn) return;
    // Voting is locked once a vote exists — they must clear it first.
    if (current.myVote) return;
    setVotingId(pollId);
    try {
      const updated = await voteOnPoll(pollId, optionId);
      setResultsByPoll((prev) => ({ ...prev, [pollId]: updated }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not record your vote'
      );
    } finally {
      setVotingId(null);
    }
  };

  const clearVote = async (pollId: string) => {
    const current = resultsByPoll[pollId];
    if (!current || current === 'loading' || !current.myVote) return;
    setVotingId(pollId);
    try {
      const updated = await clearPollVote(pollId);
      setResultsByPoll((prev) => ({ ...prev, [pollId]: updated }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not clear your vote'
      );
    } finally {
      setVotingId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = polls.filter((poll) => {
    const matchesQuery =
      !q ||
      poll.title.toLowerCase().includes(q) ||
      (poll.description?.toLowerCase().includes(q) ?? false);
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => poll.tags.includes(tag));
    return matchesQuery && matchesTags;
  });

  return (
    <div className='grid h-full grid-cols-1 gap-md lg:grid-cols-4 lg:[grid-auto-rows:1fr]'>
      <div className='min-h-0 overflow-y-auto pr-xs lg:col-span-3'>
        {polls.length === 0 ? (
          <Card
            shadow
            className='h-full items-center justify-center'
          >
            <Typography
              variant='p2'
              color='muted'
            >
              No polls yet. Create the first one!
            </Typography>
          </Card>
        ) : filtered.length === 0 ? (
          <Card
            shadow
            className='h-full items-center justify-center'
          >
            <Typography
              variant='p2'
              color='muted'
            >
              No polls match your filters.
            </Typography>
          </Card>
        ) : (
          <div className='flex flex-col gap-2'>
            {filtered.map((poll) => (
              <PollAccordion
                key={poll.id}
                poll={poll}
                isOwner={!!currentUserId && poll.createdBy === currentUserId}
                open={openIds.has(poll.id)}
                results={resultsByPoll[poll.id]}
                voting={votingId === poll.id}
                onToggle={() => togglePoll(poll.id)}
                onVote={(optionId) => vote(poll.id, optionId)}
                onClear={() => clearVote(poll.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className='flex flex-col gap-md lg:col-span-1'>
        <Card
          shadow
          className='gap-4'
        >
          <div className='flex items-center gap-2'>
            <SlidersHorizontal className='size-5 text-primary' />
            <Typography
              variant='h4'
              display
              classNames='!mb-0 text-primary'
            >
              Filters
            </Typography>
          </div>

          <Input
            type='search'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search'
            aria-label='Search polls'
            startIcon={<Search />}
          />

          {allTags.length > 0 && (
            <div className='flex flex-col gap-1.5'>
              <Typography
                variant='caption'
                color='muted'
                classNames='text-xs font-medium'
              >
                Tags
              </Typography>
              <div className='flex flex-wrap gap-1.5'>
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type='button'
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                    >
                      <Chip
                        label={tag}
                        size='small'
                        variant={active ? 'filled' : 'outline'}
                        colors='accent'
                        className='cursor-pointer capitalize'
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
