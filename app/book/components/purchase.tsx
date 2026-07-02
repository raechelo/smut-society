import React from 'react';
import { Card, CardHeader } from '../../../components/ui/card';

export const Purchase = () => {
  return (
    <Card
      cornerDecoration='all'
      className='flex-1'
    >
      <CardHeader>Buy this Book</CardHeader>
    </Card>
  );
};
