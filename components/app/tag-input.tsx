'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Open-ended tag entry: type a tag and press Enter or comma to commit it as a
// removable chip. Tags are trimmed, lowercased, and deduped; the parent owns
// the array. `max` caps how many can be added.
export function TagInput({
  value,
  onChange,
  max = 10,
  placeholder = 'Add a tag and press Enter',
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const atLimit = value.length >= max;

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!tag || atLimit || value.includes(tag)) return;
    onChange([...value, tag]);
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      // Backspace on an empty field peels off the last tag.
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={atLimit ? `Up to ${max} tags` : placeholder}
        disabled={atLimit}
        aria-label='Add a tag'
      />
      {value.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {value.map((tag) => (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-accent bg-accent/15 px-2 py-0.5 text-xs font-medium capitalize text-accent'
              )}
            >
              {tag}
              <button
                type='button'
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className='rounded-full text-accent/70 transition-colors hover:text-accent'
              >
                <X className='size-3' />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
