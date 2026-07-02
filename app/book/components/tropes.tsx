import React from 'react';
import { Card, CardHeader } from '../../../components/ui/card';
import Typography from '../../../components/ui/typography';

export const Tropes = () => {
  return (
    <Card
      cornerDecoration='all'
      className='flex-1 h-full'
    >
      <CardHeader>
        <Typography variant='h2'>Tropes</Typography>
      </CardHeader>
    </Card>
  );
};
