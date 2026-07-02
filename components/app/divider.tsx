import { cn } from '../../lib/utils';

export const Divider = ({
  classNames,
  variant = 'fancy',
}: {
  classNames?: string;
  variant?: 'fancy' | 'long' | 'short';
}) => {
  let src = '/divider.png';
  let imgClassNames = 'w-full h-[70px] my-[-8px]';

  if (variant === 'long') {
    src = '/long-divider.png';
    imgClassNames = 'w-full h-[70px]';
  }
  if (variant === 'short') {
    src = '/short-divider.png';
    imgClassNames = 'w-full h-[35px] my-sm';
  }

  return (
    <div
      data-slot='fancy-divider'
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
