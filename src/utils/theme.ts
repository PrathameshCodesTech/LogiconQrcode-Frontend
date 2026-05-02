export type Theme = 'light' | 'dark';

const THEME_KEY = 'logicon_theme';

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

export function toggleTheme(theme: Theme): Theme {
  const next = theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
