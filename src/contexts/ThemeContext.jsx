import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [oscuro, setOscuro] = useState(() => {
    try {
      const saved = localStorage.getItem('empanadas_tema');
      if (saved) return saved === 'oscuro';
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro);
    document.body.classList.toggle('dark', oscuro);
    try { localStorage.setItem('empanadas_tema', oscuro ? 'oscuro' : 'claro'); } catch { /* noop */ }
  }, [oscuro]);

  const value = useMemo(() => ({ oscuro, toggle: () => setOscuro((v) => !v) }), [oscuro]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
