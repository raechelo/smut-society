import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import Typography from '../ui/typography';

export const Details = () => {
  return (
    <Card
      variant='painted'
      color='wine'
      className='flex-2'
    >
      <CardHeader>
        <Typography
          variant='h2'
          classNames='text-parchment'
        >
          Details
        </Typography>
      </CardHeader>
      <CardContent>
        <Typography
          variant='p'
          classNames='text-parchment'
        >
          Author:
        </Typography>
        <Typography
          variant='p'
          classNames='text-parchment'
        >
          Romance:
        </Typography>
        <Typography
          variant='p'
          classNames='text-parchment'
        >
          Published: Oct. 22, 2018
        </Typography>
      </CardContent>
    </Card>
  );
};
