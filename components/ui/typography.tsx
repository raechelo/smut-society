import clsx from 'clsx';
import React from 'react';

type TypographyProps = {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  color?: 'primary' | 'secondary' | 'accent' | 'wine';
  classNames?: string;
  children: React.ReactNode;
};

const styles = {
  h1: 'text-5xl font-display mb-md',
  h2: 'text-4xl font-display',
  h3: 'text-3xl font-display',
  h4: 'text-2xl font-display',
  h5: 'text-xl font-display',
  h6: 'text-lg font-display',
  p: 'text-base',
  span: 'text-sm',
};

const Typography = ({
  variant = 'p',
  classNames,
  children,
}: TypographyProps) => {
  const Tag = variant;
  return (
    <Tag className={clsx([styles[variant], classNames])}>{children}</Tag>
  );
};

export default Typography;
