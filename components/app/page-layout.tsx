import type { ReactNode } from 'react';
import Typography from '../ui/typography';

type PageLayoutProps = {
  title: string;
  children: ReactNode;
};

export const PageLayout = ({ title, children }: PageLayoutProps) => {
  return (
    <div className='flex size-full flex-col px-lg'>
      <Typography
        variant='h1'
        classNames='text-primary !mb-sm'
      >
        {title}
      </Typography>
      <div className='min-h-0 flex-1'>{children}</div>
    </div>
  );
};
