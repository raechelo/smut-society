'use client';

import { useSyncExternalStore } from 'react';
import { Switch } from '../ui/switch';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

// Never changes after mount, so subscribing is a no-op.
const emptySubscribe = () => () => {};

export const ThemeToggler = () => {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoid a hydration mismatch: the server (and first client paint) sees
  // `false`, then this flips to `true` on the client — without a
  // setState-in-effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

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
