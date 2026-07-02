import type { ReactNode } from 'react';
import Typography from '../ui/typography';

type PageLayoutProps = {
  title: string;
  children: ReactNode;
};

export const PageLayout = ({ title, children }: PageLayoutProps) => {
  return (
    <div className='flex size-full flex-col'>
      <Typography
        variant='h1'
        classNames='text-primary !mb-sm'
      >
        {title}
      </Typography>
      <div className='px-xl w-[85%] my-[-16px] mx-auto'>
        <img
          src='/long-divider.png'
          alt=''
          role='presentation'
          className='h-[35px] w-full object-cover object-bottom'
        />
      </div>
      <div className='mt-md min-h-0 flex-1'>{children}</div>
    </div>
  );
};
