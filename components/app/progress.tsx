import React from 'react';

export const Progress = ({
  currentValue,
  highValue = 100,
  lowValue = 0,
  includeLabels = true,
}: {
  currentValue: number;
  highValue: number;
  lowValue: number;
  includeLabels: boolean;
}) => {
  return (
    <div>
      {includeLabels && <p>{lowValue}</p>}
      <div className='rounded-md h-1 outline-dark'>
        <div className='rounded-md h-1 bg-wine' />
      </div>
      {includeLabels && <p>{highValue}</p>}
    </div>
  );
};
