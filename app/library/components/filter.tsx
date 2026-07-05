import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Chip } from '@/components/app/chip';
import { FilterIcon } from 'lucide-react';
import {
  GENRES,
  LENGTH_OPTIONS,
  DEFAULT_FILTERS,
  type BookFilters,
  type LengthFilter,
} from '@/lib/types/books';
import { cn } from '@/lib/utils';

type FilterProps = {
  value: string;
  onChange: (value: string) => void;
  filters: BookFilters;
  onFiltersChange: (filters: BookFilters) => void;
};

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export const Filter = ({
  value,
  onChange,
  filters,
  onFiltersChange,
}: FilterProps) => {
  const activeCount = filters.genres.length + filters.lengths.length;
  const hasActiveFilters = activeCount > 0;

  return (
    <div className='flex w-full gap-sm'>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='icon-md'
            className={cn(
              'relative',
              hasActiveFilters && 'border-primary text-primary'
            )}
          >
            <FilterIcon />
            {hasActiveFilters && (
              <span className='absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align='start'
          className='flex w-80 flex-col gap-lg p-lg'
        >
          <div className='flex flex-col gap-sm'>
            <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              Sort by
            </p>
            <div className='flex gap-xs'>
              {(['relevance', 'newest'] as const).map((s) => (
                <Chip
                  key={s}
                  label={s === 'relevance' ? 'Relevance' : 'Newest'}
                  size='small'
                  variant={filters.sortBy === s ? 'filled' : 'outline'}
                  colors='primary'
                  className='cursor-pointer select-none capitalize'
                  onClick={() => onFiltersChange({ ...filters, sortBy: s })}
                />
              ))}
            </div>
          </div>

          <div className='flex flex-col gap-sm'>
            <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              Genre
            </p>
            <div className='flex flex-wrap gap-xs'>
              {GENRES.map((g) => (
                <Chip
                  key={g.value}
                  label={g.label}
                  size='small'
                  variant={
                    filters.genres.includes(g.value) ? 'filled' : 'outline'
                  }
                  colors='primary'
                  className='cursor-pointer select-none'
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      genres: toggle(filters.genres, g.value),
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className='flex flex-col gap-sm'>
            <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              Length
            </p>
            <div className='flex gap-xs'>
              {LENGTH_OPTIONS.map((l) => (
                <Chip
                  key={l.value}
                  label={l.label}
                  size='small'
                  variant={
                    filters.lengths.includes(l.value) ? 'filled' : 'outline'
                  }
                  colors='secondary'
                  className='cursor-pointer select-none'
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      lengths: toggle(filters.lengths, l.value as LengthFilter),
                    })
                  }
                />
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() =>
                onFiltersChange({ ...DEFAULT_FILTERS, sortBy: filters.sortBy })
              }
              className='self-start text-xs text-muted-foreground underline-offset-2 hover:underline'
            >
              Clear filters
            </button>
          )}
        </PopoverContent>
      </Popover>

      <div className='flex-1'>
        <Input
          type='text'
          placeholder='Search books...'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};
