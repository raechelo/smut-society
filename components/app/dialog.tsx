'use client';

import * as React from 'react';
import {
  Dialog as DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type DialogProps = {
  trigger: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Dialog({
  trigger,
  title,
  description,
  content,
  footer,
  className,
  open,
  onOpenChange,
}: DialogProps) {
  const gridRows =
    content != null
      ? footer != null
        ? 'grid-rows-[auto_minmax(0,1fr)_auto]'
        : 'grid-rows-[auto_minmax(0,1fr)]'
      : undefined;

  return (
    <DialogRoot
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(gridRows, className)}
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {content != null ? (
          <div className='min-h-0 overflow-y-auto'>{content}</div>
        ) : null}
        {footer != null ? (
          <div className='border-t border-border/40 pt-4'>{footer}</div>
        ) : null}
      </DialogContent>
    </DialogRoot>
  );
}
