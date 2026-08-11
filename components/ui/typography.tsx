import clsx from 'clsx';
import React from 'react';

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'p2'
  | 'span'
  | 'caption';

type TypographyProps = {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'accent' | 'wine';
  classNames?: string;
  children: React.ReactNode;
};

const styles: Record<Variant, string> = {
  h1: 'text-5xl font-display mb-md',
  h2: 'text-4xl font-display',
  h3: 'text-3xl font-display',
  h4: 'text-2xl font-display',
  h5: 'text-xl font-display',
  h6: 'text-lg font-display',
  p: 'text-base',
  p2: 'text-sm',
  span: 'text-sm',
  caption: 'text-[10px] uppercase tracking-wide',
};

// Some variants are visual only and don't map 1:1 to a tag name — p2 stays a
// semantic <p>, caption renders inline as a <span>.
const tags: Record<Variant, React.ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'p',
  p2: 'p',
  span: 'span',
  caption: 'span',
};

const Typography = ({
  variant = 'p',
  classNames,
  children,
}: TypographyProps) => {
  const Tag = tags[variant];
  return <Tag className={clsx([styles[variant], classNames])}>{children}</Tag>;
};

export default Typography;
