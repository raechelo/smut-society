import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import type { ReadingGoalRow } from '@/lib/actions/home';

function GoalCard({ goal }: { goal: ReadingGoalRow }) {
  const pct =
    goal.target > 0
      ? Math.min(100, Math.round((goal.read / goal.target) * 100))
      : 0;
  const met = goal.read >= goal.target;

  return (
    <Card className='gap-2'>
      <div className='flex items-baseline justify-between gap-sm'>
        <Typography
          variant='h4'
          display
          classNames='!mb-0 text-primary'
        >
          {goal.year}
        </Typography>
        <Typography
          variant='p2'
          color='muted'
        >
          {goal.read} of {goal.target} books
        </Typography>
      </div>
      <div className='h-2 w-full overflow-hidden rounded-full bg-foreground/10'>
        <div
          className='h-full rounded-full bg-accent'
          style={{ width: `${pct}%` }}
        />
      </div>
      <Typography
        variant='caption'
        color='muted'
      >
        {goal.status === 'completed'
          ? met
            ? 'Goal reached 🎉'
            : 'Year ended'
          : `${Math.max(0, goal.target - goal.read)} to go`}
      </Typography>
    </Card>
  );
}

function GoalList({
  goals,
  emptyLabel,
}: {
  goals: ReadingGoalRow[];
  emptyLabel: string;
}) {
  if (goals.length === 0) {
    return (
      <Typography
        variant='p2'
        color='muted'
        classNames='py-md'
      >
        {emptyLabel}
      </Typography>
    );
  }
  return (
    <div className='grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3'>
      {goals.map((g) => (
        <GoalCard
          key={g.year}
          goal={g}
        />
      ))}
    </div>
  );
}

export function ReadingGoals({ goals }: { goals: ReadingGoalRow[] }) {
  const current = goals.filter((g) => g.status === 'in progress');
  const completed = goals.filter((g) => g.status === 'completed');

  return (
    <section className='flex flex-col gap-sm'>
      <Typography
        variant='h3'
        display
        classNames='!mb-0 text-primary'
      >
        Reading goals
      </Typography>
      <Tabs defaultValue='current'>
        <TabsList>
          <TabsTrigger value='current'>Current</TabsTrigger>
          <TabsTrigger value='completed'>Completed</TabsTrigger>
        </TabsList>
        <TabsContent value='current'>
          <GoalList
            goals={current}
            emptyLabel='No active goal for this year yet.'
          />
        </TabsContent>
        <TabsContent value='completed'>
          <GoalList
            goals={completed}
            emptyLabel='No completed goals yet.'
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
