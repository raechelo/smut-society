import Typography from '@/components/ui/typography';
import { CategoryDonut } from './category-donut';
import type { StatSlice } from '@/lib/actions/stats';

function StatBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-1 flex-col gap-3'>
      <Typography
        variant='h4'
        display
        classNames='!mb-0 text-primary'
      >
        {title}
      </Typography>
      {children}
    </div>
  );
}

export function ReadingStats({
  genres,
  spice,
  source,
}: {
  genres: StatSlice[];
  spice: number[];
  source: StatSlice[];
}) {
  // Spice counts arrive as [level1..level5]; keep all five in level order so the
  // donut colors each by its rust-ramp step (zeros are dropped from the legend).
  const spiceSlices: StatSlice[] = spice.map((value, i) => ({
    label: `${i + 1} 🌶`,
    value,
  }));

  return (
    <section className='flex flex-col gap-lg md:flex-row md:gap-md'>
      <StatBlock title='Genres read'>
        <CategoryDonut
          data={genres}
          title='Genres read'
          emptyLabel='Finish a book and your genre mix will show up here.'
        />
      </StatBlock>

      <StatBlock title='Spice ratings'>
        <CategoryDonut
          data={spiceSlices}
          title='Spice ratings'
          variant='sequential'
          emptyLabel="Rate a book's spice and it'll chart here."
        />
      </StatBlock>

      <StatBlock title='Reads by source'>
        <CategoryDonut
          data={source}
          title='Reads by source'
          emptyLabel='Finish a book to see your club vs. personal split.'
        />
      </StatBlock>
    </section>
  );
}
