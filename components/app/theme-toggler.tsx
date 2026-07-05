'use client';

import { useEffect, useState } from 'react';
import { Switch } from '../ui/switch';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggler = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Switch
      checked={mounted && resolvedTheme === 'dark'}
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      size='default'
      leadingIcon={<Sun className='text-ink' />}
      trailingIcon={<Moon className='text-ink' />}
    />
  );
};
