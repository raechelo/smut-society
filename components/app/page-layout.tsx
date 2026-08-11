import type { ReactNode } from 'react';
import { Breadcrumbs } from './breadcrumb';

type PageLayoutProps = {
  crumbs?: { link?: string; label: string }[];
  children: ReactNode;
};

export const PageLayout = ({ crumbs, children }: PageLayoutProps) => {
  return (
    <div className='size-full min-h-0'>
      {crumbs && <Breadcrumbs breadcrumbs={crumbs} />}
      {children}
    </div>
  );
};
