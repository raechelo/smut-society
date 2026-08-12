import { Target } from 'lucide-react';
import { getReadingGoal } from '@/lib/actions/home';
import Typography from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { SetGoalDialog } from './set-goal-dialog';

export async function ReadingGoal() {
  const goal = await getReadingGoal();
  const pct =
    goal && goal.target > 0
      ? Math.min(100, Math.round((goal.read / goal.target) * 100))
      : 0;

  return (
    <Card
      shadow
      className='w-full gap-3'
      cornerDecoration='top'
    >
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Target className='size-5 text-primary' />
          <Typography
            variant='h4'
            classNames='!mb-0 text-primary'
          >
            Reading goal
          </Typography>
        </div>
        <SetGoalDialog current={goal?.target ?? null} />
      </div>

      {goal ? (
        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline justify-between'>
            <span className='text-2xl font-semibold text-foreground'>
              {goal.read}
              <span className='text-base font-normal text-muted-foreground'>
                {' / '}
                {goal.target} books
              </span>
            </span>
            <span className='text-sm text-muted-foreground'>{goal.year}</span>
          </div>
          <div className='h-2.5 w-full overflow-hidden rounded-full bg-primary/15'>
            <div
              className='h-full rounded-full bg-primary'
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className='text-xs text-muted-foreground'>
            {goal.read >= goal.target
              ? 'Goal reached — incredible! 🎉'
              : `${goal.target - goal.read} to go`}
          </span>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Set a goal for how many books you want to read this year.
        </p>
      )}
    </Card>
  );
}
