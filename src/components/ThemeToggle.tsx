import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, toggleTheme, type Theme } from '../utils/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const initialTheme = getStoredTheme();
    applyTheme(initialTheme);
    setTheme(initialTheme);
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme((current) => toggleTheme(current))}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`relative flex h-7 w-[52px] shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        isDark ? 'bg-blue-900' : 'bg-slate-200'
      }`}
    >
      {/* track icons */}
      <Sun className={`absolute left-1.5 h-3 w-3 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-40 text-amber-600'}`} />
      <Moon className={`absolute right-1.5 h-3 w-3 transition-opacity duration-300 ${isDark ? 'opacity-40 text-blue-300' : 'opacity-0'}`} />

      {/* sliding knob */}
      <span
        className={`absolute flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
          isDark ? 'translate-x-[27px]' : 'translate-x-[3px]'
        }`}
      >
        {isDark
          ? <Moon className="h-3 w-3 text-blue-700" />
          : <Sun className="h-3 w-3 text-amber-500" />
        }
      </span>
    </button>
  );
}
