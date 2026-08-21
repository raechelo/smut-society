'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/app/chip';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { ClubCadencePeriod, PublicClub } from '@/lib/actions/clubs';
import { ClubCard } from './club-card';
import { JoinButton } from './join-button';

type SizeFilter = 'any' | 'small' | 'medium' | 'large';
type CadenceFilter = 'any' | ClubCadencePeriod;

// Member-count buckets for the size filter.
function inSizeBucket(memberCount: number, size: SizeFilter): boolean {
  switch (size) {
    case 'small':
      return memberCount <= 5;
    case 'medium':
      return memberCount >= 6 && memberCount <= 15;
    case 'large':
      return memberCount >= 16;
    default:
      return true;
  }
}

const SIZE_OPTIONS: { value: SizeFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'small', label: 'Small (1–5)' },
  { value: 'medium', label: 'Medium (6–15)' },
  { value: 'large', label: 'Large (16+)' },
];

const CADENCE_OPTIONS: { value: CadenceFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

// A labeled row of mutually-exclusive filter pills.
function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Typography
        variant='caption'
        color='muted'
        classNames='text-xs font-medium'
      >
        {label}
      </Typography>
      <div className='flex flex-wrap gap-xs'>
        {options.map((option) => (
          <Button
            key={option.value}
            type='button'
            size='sm'
            variant={value === option.value ? 'solid' : 'outline'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Client-side browser for public clubs: a name/description search plus size and
// cadence filters over the join/view grid. The list is small enough to filter
// in memory rather than round-tripping to the server on every change.
//
// `fillHeight` (the default) makes the browser own its vertical space and scroll
// the grid internally — right for the standalone /explore page. Set it false to
// let the browser flow at its natural height inside a page that scrolls as a
// whole (e.g. embedded under a section header on /bookclubs).
export function ExploreClubsBrowser({
  clubs,
  fillHeight = true,
}: {
  clubs: PublicClub[];
  fillHeight?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [size, setSize] = useState<SizeFilter>('any');
  const [cadence, setCadence] = useState<CadenceFilter>('any');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Every tag in use across the public clubs, for the tag filter row.
  const allTags = Array.from(new Set(clubs.flatMap((c) => c.tags))).sort();

  const toggleTag = (tag: string) =>
    setSelectedTags((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    );

  const q = query.trim().toLowerCase();
  const filtered = clubs.filter((club) => {
    const matchesQuery =
      !q ||
      club.name.toLowerCase().includes(q) ||
      (club.description?.toLowerCase().includes(q) ?? false);
    const matchesSize = inSizeBucket(club.memberCount, size);
    const matchesCadence =
      cadence === 'any' || club.cadence?.period === cadence;
    // A club matches if it carries any of the selected tags.
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => club.tags.includes(tag));
    return matchesQuery && matchesSize && matchesCadence && matchesTags;
  });

  return (
    <div className={cn('flex flex-col gap-md', fillHeight && 'h-full')}>
      <div className='flex shrink-0 flex-col gap-sm'>
        <Input
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search clubs by name or description'
          aria-label='Search clubs by name or description'
          startIcon={<Search />}
        />
        <div className='flex flex-wrap gap-lg'>
          <FilterGroup
            label='Club size'
            value={size}
            options={SIZE_OPTIONS}
            onChange={setSize}
          />
          <FilterGroup
            label='Reading pace'
            value={cadence}
            options={CADENCE_OPTIONS}
            onChange={setCadence}
          />
        </div>
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
      </div>

      <div
        className={cn(
          'pt-1',
          fillHeight && 'min-h-0 flex-1 overflow-y-auto pr-xs'
        )}
      >
        {clubs.length === 0 ? (
          <Typography
            variant='p2'
            color='muted'
            classNames='mt-xl text-center'
          >
            No public clubs yet. Be the first to create one!
          </Typography>
        ) : filtered.length === 0 ? (
          <Typography
            variant='p2'
            color='muted'
            classNames='mt-xl text-center'
          >
            No clubs match your filters.
          </Typography>
        ) : (
          <div className='grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3'>
            {filtered.map((club) => (
              <ClubCard
                key={club.id}
                name={club.name}
                description={club.description}
                memberCount={club.memberCount}
                badges={
                  club.tags.length > 0
                    ? club.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size='small'
                          variant='painted'
                          colors='accent'
                          className='capitalize'
                        />
                      ))
                    : undefined
                }
                footer={
                  <>
                    <Link href={`/bookclubs/${club.id}`}>
                      <Button variant='outline'>
                        <Eye /> View
                      </Button>
                    </Link>
                    <JoinButton
                      clubId={club.id}
                      joined={club.isMember}
                    />
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
