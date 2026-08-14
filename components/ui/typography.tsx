import React from 'react';
import { cn } from '@/lib/utils';

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

type Color =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'wine'
  | 'muted'
  | 'foreground'
  | 'error';

type TypographyProps = {
  variant?: Variant;
  color?: Color;
  // Render in the fancy display font (Fleur De Leah). Opt-in so headings can
  // use Typography without the script face.
  display?: boolean;
  classNames?: string;
  children: React.ReactNode;
  // Standard HTML attributes (id, title, suppressHydrationWarning, aria-*, …)
  // pass straight through to the rendered element.
} & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'color' | 'children'>;

const styles: Record<Variant, string> = {
  h1: 'text-5xl mb-md',
  h2: 'text-4xl',
  h3: 'text-3xl',
  h4: 'text-2xl',
  h5: 'text-xl',
  h6: 'text-lg',
  p: 'text-base',
  p2: 'text-sm',
  span: 'text-xs',
  caption: 'text-[10px] uppercase tracking-wide',
};

// Colors resolve to global tokens so callers don't hand-roll text-* classes.
const colors: Record<Color, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  wine: 'text-wine',
  muted: 'text-muted-foreground',
  foreground: 'text-foreground',
  error: 'text-error',
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
  color,
  display = false,
  classNames,
  children,
  ...rest
}: TypographyProps) => {
  const Tag = tags[variant];
  return (
    <Tag
      className={cn(
        styles[variant],
        display && 'font-display',
        color && colors[color],
        classNames
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Typography;
