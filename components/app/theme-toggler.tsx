'use client';

import { Switch } from '../ui/switch';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggler = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Switch
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      size='default'
      leadingIcon={<Sun className='text-ink' />}
      trailingIcon={<Moon className='text-ink' />}
    />
  );
};
