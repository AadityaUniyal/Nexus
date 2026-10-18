'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-transform duration-150"
      aria-label="Toggle theme"
    >
      <span className="transition-transform duration-300 transform-gpu">
        {isDark ? (
          <Sun className="h-4 w-4 text-[#FFC400]" />
        ) : (
          <Moon className="h-4 w-4 text-[#11120F]" />
        )}
      </span>
    </Button>
  );
}
