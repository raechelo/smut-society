'use client';

import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export const Page = () => {
  const { game } = useParams<{ game: string }>();
  const title = game
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <PageLayout title={title}>
      <div className='flex flex-col'>
        <Link href='/challenges'>
          <Button
            variant='ghost'
            className='px-0'
          >
            <ArrowLeft /> Back to challenges
          </Button>
        </Link>
        Page
      </div>
    </PageLayout>
  );
};

export default Page;
