'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/app/tag-input';
import Typography from '@/components/ui/typography';
import { createClub, type ClubCadencePeriod } from '@/lib/actions/clubs';
import { toast } from 'sonner';
import { Globe, Lock, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CADENCE_PERIODS: { value: ClubCadencePeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function CreateClubDialog({ trigger }: { trigger?: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  // Cadence is optional: a book count paired with a period. It only counts as
  // set once a period is chosen.
  const [cadenceCount, setCadenceCount] = useState('1');
  const [cadencePeriod, setCadencePeriod] = useState<ClubCadencePeriod | ''>(
    ''
  );
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && isPublic !== null && !submitting;

  const handleSubmit = async () => {
    if (isPublic === null || !name.trim()) return;
    setSubmitting(true);
    try {
      const { id } = await createClub({
        name,
        description,
        isPublic,
        cadence: cadencePeriod
          ? { count: Number(cadenceCount) || 1, period: cadencePeriod }
          : null,
        tags,
      });
      toast.success('Club created');
      setOpen(false);
      router.push(`/bookclubs/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create club';
      toast.error(msg === 'Unauthorized' ? 'Sign in to create a club' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <form
      className='flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) handleSubmit();
      }}
    >
      <label className='flex flex-col gap-1.5'>
        <Typography
          variant='caption'
          color='muted'
          classNames='text-xs font-medium'
        >
          Name
        </Typography>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. Spicy Fantasy Book Club'
          autoFocus
        />
      </label>

      <label className='flex flex-col gap-1.5'>
        <Typography
          variant='caption'
          color='muted'
          classNames='text-xs font-medium'
        >
          Description
        </Typography>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder='What is this club about?'
        />
      </label>

      <div className='flex flex-col gap-1.5'>
        <Typography
          variant='caption'
          color='muted'
          classNames='text-xs font-medium'
        >
          Tags <span className='font-normal'>(optional)</span>
        </Typography>
        <TagInput
          value={tags}
          onChange={setTags}
          placeholder='e.g. romance, fantasy, lgbt'
        />
        <Typography
          variant='p2'
          color='muted'
          classNames='text-xs'
        >
          Help readers find your club. Press Enter or comma to add each tag.
        </Typography>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Typography
          variant='caption'
          color='muted'
          classNames='text-xs font-medium'
        >
          Visibility
        </Typography>
        <div className='grid grid-cols-2 gap-xs'>
          <Button
            type='button'
            variant={isPublic === true ? 'solid' : 'outline'}
            onClick={() => setIsPublic(true)}
          >
            <Globe /> Public
          </Button>
          <Button
            type='button'
            variant={isPublic === false ? 'solid' : 'outline'}
            onClick={() => setIsPublic(false)}
          >
            <Lock /> Private
          </Button>
        </div>
        <Typography
          variant='p2'
          color='muted'
          classNames='text-xs'
        >
          {isPublic === true
            ? 'Anyone can find and join this club.'
            : isPublic === false
            ? 'Hidden from Explore; only members can view it.'
            : 'Choose who can find and join.'}
        </Typography>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Typography
          variant='caption'
          color='muted'
          classNames='text-xs font-medium'
        >
          Reading pace <span className='font-normal'>(optional)</span>
        </Typography>
        <div className='grid grid-cols-2 gap-xs'>
          <label className='flex items-center gap-xs'>
            <Input
              type='number'
              min={1}
              max={99}
              value={cadenceCount}
              onChange={(e) => setCadenceCount(e.target.value)}
              aria-label='Number of books'
            />
            <Typography
              variant='p2'
              color='muted'
              classNames='text-xs whitespace-nowrap'
            >
              {Number(cadenceCount) === 1 ? 'book' : 'books'}
            </Typography>
          </label>
          <Select
            value={cadencePeriod || undefined}
            onValueChange={(v) => setCadencePeriod(v as ClubCadencePeriod)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Period' />
            </SelectTrigger>
            <SelectContent>
              {CADENCE_PERIODS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Typography
          variant='p2'
          color='muted'
          classNames='text-xs'
        >
          This will only be used for others to see if your club fits their
          reading pace. You can change it later.
        </Typography>
      </div>

      <Button
        type='submit'
        disabled={!canSubmit}
      >
        Create club
      </Button>
    </form>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger ?? (
          <Button>
            <Plus /> Create club
          </Button>
        )
      }
      title='Create a book club'
      description='Start a new club and gather your fellow readers.'
      content={content}
    />
  );
}
