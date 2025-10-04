import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './button';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
    >
      <Sun className={`absolute h-4 w-4 transition-all duration-500 ${
        isDark 
          ? 'rotate-90 scale-0 opacity-0' 
          : 'rotate-0 scale-100 opacity-100'
      }`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-500 ${
        isDark 
          ? 'rotate-0 scale-100 opacity-100' 
          : '-rotate-90 scale-0 opacity-0'
      }`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}