import { Details } from '@/components/app/details';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Typography from '@/components/ui/typography';

const BookPage = () => {
  return (
    <div className='size-full'>
      <Typography
        variant='h1'
        classNames='text-primary'
      >
        Current Book
      </Typography>
      <Separator className='bg-wine m-sm h-[2px]' />

      <div className='size-full flex flex-row gap-md'>
        <div className='w-[65%]'>img will go here</div>
        <div className='w-[35%] h-full flex flex-col gap-sm p-md'>
          <Details />
          <Card
            variant='filled'
            className='flex-1'
          >
            Buy This Book
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookPage;
