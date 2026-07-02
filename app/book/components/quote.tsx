import { Card, CardHeader } from '../../../components/ui/card';
import Typography from '../../../components/ui/typography';

export const Quote = () => {
  return (
    <Card
      cornerDecoration='all'
      className='flex-1 h-full'
    >
      <CardHeader>
        <Typography variant='h2'>Favorite Quote</Typography>
      </CardHeader>
    </Card>
  );
};
