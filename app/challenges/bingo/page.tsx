import { PageLayout } from '@/components/app/page-layout';
import Typography from '@/components/ui/typography';
import { BingoCard } from './bingo-card';

export default function BingoPage() {
  return (
    <PageLayout
      crumbs={[
        { label: 'Challenges', link: '/challenges' },
        { label: 'Bingo' },
      ]}
    >
      <div className='flex h-full flex-col items-center gap-md overflow-y-auto pr-xs pt-md'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <Typography
            variant='h2'
            display
            classNames='!mb-0 text-primary'
          >
            Book Bingo
          </Typography>
          <Typography
            variant='p2'
            color='muted'
          >
            Fill each square with a prediction for your next read.
          </Typography>
        </div>

        <BingoCard />
      </div>
    </PageLayout>
  );
}
