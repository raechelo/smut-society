import { auth } from '@/auth';
import { PageLayout } from '@/components/app/page-layout';
import Typography from '@/components/ui/typography';
import { getMyBingoCards } from '@/lib/actions/bingo';
import { BingoList } from './bingo-list';

export default async function BingoPage() {
  const [session, cards] = await Promise.all([auth(), getMyBingoCards()]);
  const signedIn = !!session?.user?.id;

  return (
    <PageLayout
      crumbs={[{ label: 'Challenges', link: '/challenges' }, { label: 'Bingo' }]}
    >
      <div className='flex h-full flex-col gap-md overflow-y-auto pr-xs pt-md'>
        <div className='flex flex-col gap-1'>
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
            Make a card of predictions for your next read, then mark each square
            as it comes true.
          </Typography>
        </div>

        <BingoList
          cards={cards}
          signedIn={signedIn}
        />
      </div>
    </PageLayout>
  );
}
