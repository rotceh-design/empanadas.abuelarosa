// ============================================
// Iconos SVG de línea para el panel admin.
// Mismo concepto vintage que la tienda: trazos
// limpios, esquinas redondeadas, un solo grosor.
// Usan currentColor para heredar el color del
// texto (pestaña activa = crema, inactiva = tierra).
// ============================================

function S({ size = 20, className = '', children }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function IconoPanel({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </S>
  );
}

export function IconoPedidos({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4V3.5z" />
      <path d="M9 8.5h6M9 12.5h6" />
    </S>
  );
}

export function IconoCatalogo({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z" />
      <path d="M12 6.5v15" />
    </S>
  );
}

export function IconoInventario({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 3.5 20 7.5v9L12 20.5 4 16.5v-9L12 3.5z" />
      <path d="M4 7.5 12 11.5l8-4M12 11.5v9" />
    </S>
  );
}

export function IconoOfertas({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="4" y="9" width="16" height="4" rx="1" />
      <path d="M5.5 13v6.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V13" />
      <path d="M12 9v11.5" />
      <path d="M12 9s-1.5-4.5-4-3.5S9.5 9 12 9zm0 0s1.5-4.5 4-3.5S14.5 9 12 9z" />
    </S>
  );
}

export function IconoProduccion({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M3.5 20.5h17" />
      <path d="M5 20.5V10.5l4.5 3V10.5l4.5 3V6.5a1 1 0 0 1 1-1H19v15" />
      <path d="M8 6.5V3.5h2v3" />
    </S>
  );
}

export function IconoMetricas({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M4 20.5h16" />
      <path d="M7 20.5v-6M12 20.5v-11M17 20.5v-8" />
    </S>
  );
}

export function IconoConfig({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </S>
  );
}
