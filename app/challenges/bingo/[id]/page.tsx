import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/app/page-layout';
import { getBingoCard } from '@/lib/actions/bingo';
import { BingoCard } from '../bingo-card';

export default async function BingoCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await getBingoCard(id);
  if (!card) notFound();

  return (
    <PageLayout
      crumbs={[
        { label: 'Challenges', link: '/challenges' },
        { label: 'Bingo', link: '/challenges/bingo' },
        { label: card.title.trim() || 'Untitled card' },
      ]}
    >
      <div className='flex h-full flex-col items-center gap-md overflow-y-auto pr-xs pt-md'>
        <BingoCard initial={card} />
      </div>
    </PageLayout>
  );
}
