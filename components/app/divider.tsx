import { cn } from '../../lib/utils';

export const Divider = ({
  classNames,
  fancy = false,
}: {
  classNames?: string;
  // When true, render the ornamental divider.png. Otherwise render a plain
  // horizontal line like a regular divider.
  fancy?: boolean;
}) => {
  if (fancy) {
    return (
      <div
        data-slot='divider'
        className={cn('relative flex w-full min-w-0', classNames)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/divider.png'
          alt=''
          role='presentation'
          className='w-full h-[70px] my-[-8px] divider-filter-fancy'
        />
      </div>
    );
  }

  return (
    <div
      data-slot='divider'
      role='presentation'
      className={cn('w-full border-t border-border', classNames)}
    />
  );
};
