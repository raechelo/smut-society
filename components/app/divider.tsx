import { cn } from '../../lib/utils';

export const Divider = ({
  classNames,
  variant = 'fancy',
}: {
  classNames?: string;
  variant?: 'fancy' | 'long' | 'short';
}) => {
  let src = '/divider.png';
  let imgClassNames = 'w-full h-[70px] my-[-8px] divider-filter-fancy';

  if (variant === 'long') {
    src = '/long-divider.png';
    imgClassNames = 'w-full h-[70px] divider-filter';
  }
  if (variant === 'short') {
    src = '/short-divider.png';
    imgClassNames = 'w-full h-[35px] my-sm divider-filter';
  }

  return (
    <div
      data-slot='divider'
      className={cn('relative flex w-full min-w-0', classNames)}
    >
      <img
        src={src}
        alt=''
        role='presentation'
        className={imgClassNames}
      />
    </div>
  );
};
