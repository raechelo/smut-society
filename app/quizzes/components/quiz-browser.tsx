'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/app/chip';
import { Rating } from '@/components/ui/rating';
import Typography from '@/components/ui/typography';
import type { QuizListItem } from '@/lib/actions/quizzes';

// Minimum-average-rating filter buckets. 0 means "no minimum".
const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 4, label: '4★+' },
  { value: 3, label: '3★+' },
  { value: 2, label: '2★+' },
  { value: 1, label: '1★+' },
];

export function QuizBrowser({ quizzes }: { quizzes: QuizListItem[] }) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const allTags = Array.from(new Set(quizzes.flatMap((q) => q.tags))).sort();

  const toggleTag = (tag: string) =>
    setSelectedTags((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    );

  const q = query.trim().toLowerCase();
  const filtered = quizzes.filter((quiz) => {
    const matchesQuery =
      !q ||
      quiz.title.toLowerCase().includes(q) ||
      (quiz.description?.toLowerCase().includes(q) ?? false);
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => quiz.tags.includes(tag));
    // Unrated quizzes drop out once a minimum is set.
    const matchesRating =
      minRating === 0 ||
      (quiz.avgRating != null && quiz.avgRating >= minRating);
    return matchesQuery && matchesTags && matchesRating;
  });

  return (
    <div className='grid h-full grid-cols-1 gap-md lg:grid-cols-4 lg:[grid-auto-rows:1fr]'>
      <div className='min-h-0 overflow-y-auto pr-xs lg:col-span-3'>
        {quizzes.length === 0 ? (
          <Card
            shadow
            className='h-full items-center justify-center'
          >
            <Typography
              variant='p2'
              color='muted'
            >
              No quizzes yet. Create the first one!
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
              No quizzes match your filters.
            </Typography>
          </Card>
        ) : (
          <div className='flex flex-col gap-2'>
            {filtered.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quizzes/${quiz.id}`}
                className='transition-transform hover:-translate-y-0.5'
              >
                <Card
                  shadow
                  cornerDecoration='diagonal'
                  className='flex size-full flex-col gap-sm'
                >
                  <Typography
                    variant='h6'
                    classNames='font-semibold tracking-wide'
                  >
                    {quiz.title}
                  </Typography>
                  {quiz.description ? (
                    <Typography
                      variant='p2'
                      color='muted'
                      classNames='line-clamp-3 leading-relaxed'
                    >
                      {quiz.description}
                    </Typography>
                  ) : null}
                  {quiz.tags.length > 0 && (
                    <div className='flex flex-wrap gap-xs'>
                      {quiz.tags.map((tag) => (
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
                  {quiz.ratingCount > 0 ? (
                    <div className='mt-auto flex items-center gap-2'>
                      <Rating
                        rate={quiz.avgRating ?? 0}
                        showScore
                      />
                      <Typography
                        variant='span'
                        color='muted'
                      >
                        ({quiz.ratingCount})
                      </Typography>
                    </div>
                  ) : (
                    <Typography
                      variant='span'
                      color='muted'
                      classNames='mt-auto'
                    >
                      No ratings yet
                    </Typography>
                  )}
                </Card>
              </Link>
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
            aria-label='Search quizzes'
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

          <div className='flex flex-col gap-1.5'>
            <Typography
              variant='caption'
              color='muted'
              classNames='text-xs font-medium'
            >
              Minimum rating
            </Typography>
            <div className='flex flex-wrap gap-1.5'>
              {RATING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type='button'
                  size='xs'
                  variant={minRating === option.value ? 'solid' : 'outline'}
                  onClick={() => setMinRating(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
