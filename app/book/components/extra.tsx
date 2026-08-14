import React from 'react';
import { Quote } from './quote';
import { Tropes } from './tropes';
import { Purchase } from './purchase';

export const Extras = () => {
  return (
    <div className='size-full flex gap-md'>
      <Tropes />
      <Quote />
      <Purchase />
    </div>
  );
};
