import { LibraryCard } from '@/components/app/library-card';
import { Crown } from 'lucide-react';

export const Hero = () => {
  return (
    <LibraryCard
      title='Bingo'
      subtitle='Prediction Challenge for the Book'
      cadence='Book'
      Icon={Crown}
      description='Cast your predictions for the book and see who is the first get five in a row!'
      variant='hero'
      color='primary'
    />
  );
};
