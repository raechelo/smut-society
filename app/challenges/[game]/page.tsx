'use client';

import { PageLayout } from '@/components/app/page-layout';
import { useParams } from 'next/navigation';

export const Page = () => {
  const { game } = useParams<{ game: string }>();
  const title = game
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <PageLayout
      crumbs={[{ label: 'Challenges', link: '/challenges' }, { label: title }]}
    >
      <div className='flex flex-col'>Page</div>
    </PageLayout>
  );
};

export default Page;
