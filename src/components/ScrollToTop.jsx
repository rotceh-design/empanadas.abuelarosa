import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Vuelve al top en cada navegación (la app tiene scroll-behavior: smooth).
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
}
