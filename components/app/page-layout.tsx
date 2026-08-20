import type { ReactNode } from 'react';
import { Breadcrumbs } from './breadcrumb';

type PageLayoutProps = {
  crumbs?: { link?: string; label: string }[];
  // Optional page-level call-to-action, rendered on the same row as the
  // breadcrumbs and aligned to the right (e.g. action buttons).
  cta?: ReactNode;
  children: ReactNode;
};

export const PageLayout = ({ crumbs, cta, children }: PageLayoutProps) => {
  const hasHeader = Boolean(crumbs || cta);

  return (
    <div className='flex size-full min-h-0 flex-col'>
      {hasHeader && (
        <div className='flex shrink-0 items-center justify-between gap-md pb-md'>
          {crumbs ? <Breadcrumbs breadcrumbs={crumbs} /> : <span />}
          {cta}
        </div>
      )}
      <div className='min-h-0 flex-1'>{children}</div>
    </div>
  );
};
