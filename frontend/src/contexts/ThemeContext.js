import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Verificar preferência salva ou preferência do sistema
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Aplicar tema ao document
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      // Cores para modo claro
      light: {
        primary: '#10b981', // emerald-500
        primaryHover: '#059669', // emerald-600
        secondary: '#6b7280', // gray-500
        background: '#ffffff',
        surface: '#f9fafb', // gray-50
        surfaceHover: '#f3f4f6', // gray-100
        border: '#e5e7eb', // gray-200
        text: '#111827', // gray-900
        textSecondary: '#6b7280', // gray-500
        textMuted: '#9ca3af', // gray-400
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      },
      // Cores para modo escuro
      dark: {
        primary: '#34d399', // emerald-400
        primaryHover: '#10b981', // emerald-500
        secondary: '#9ca3af', // gray-400
        background: '#111827', // gray-900
        surface: '#1f2937', // gray-800
        surfaceHover: '#374151', // gray-700
        border: '#4b5563', // gray-600
        text: '#f9fafb', // gray-50
        textSecondary: '#d1d5db', // gray-300
        textMuted: '#9ca3af', // gray-400
        success: '#34d399',
        error: '#f87171',
        warning: '#fbbf24',
        info: '#60a5fa'
      }
    }
  };

  const currentColors = isDark ? theme.colors.dark : theme.colors.light;

  return (
    <ThemeContext.Provider value={{ ...theme, colors: currentColors }}>
      {children}
    </ThemeContext.Provider>
  );
}