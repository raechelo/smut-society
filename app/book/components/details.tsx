import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import Typography from '../../../components/ui/typography';
import { Rating } from '../../../components/ui/rating';
import { Divider } from '../../../components/app/divider';
import { ReactElement } from 'react';
import {
  BookOpenText,
  BookUser,
  Calendar,
  Drama,
  NotebookText,
  Star,
} from 'lucide-react';

const DetailsItem = ({
  label,
  value,
  IconComponent,
}: {
  label: string;
  value: string | ReactElement;
  IconComponent: ReactElement;
}) => (
  <div className='flex my-xs'>
    <div className='flex flex-1 gap-xs'>
      {IconComponent}
      <Typography classNames='capitalize'>{label}</Typography>
    </div>
    {typeof value === 'string' ? (
      <Typography classNames='flex-1 capitalize'>{value}</Typography>
    ) : (
      value
    )}
  </div>
);

export const Details = () => {
  return (
    <Card
      cornerDecoration='top'
      className='w-[40%] h-full'
    >
      <CardHeader>
        <Typography variant='h2'>Details</Typography>
      </CardHeader>
      <CardContent>
        <DetailsItem
          label='author'
          value='scarlett st. clair'
          IconComponent={<BookUser />}
        />
        <DetailsItem
          label='genre'
          value='fantasy romance'
          IconComponent={<Drama />}
        />
        <DetailsItem
          label='pages'
          value='394'
          IconComponent={<NotebookText />}
        />
        <DetailsItem
          label='published'
          value='Oct. 22 2018'
          IconComponent={<Calendar />}
        />
        <Divider variant='short' />

        <DetailsItem
          label='published'
          value={
            <Rating
              rate={4.5}
              showScore
            />
          }
          IconComponent={<Star />}
        />

        <Divider variant='short' />

        <DetailsItem
          label='reading status'
          value='currently reading'
          IconComponent={<BookOpenText />}
        />
      </CardContent>
    </Card>
  );
};
