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

export function IconoReporte({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 16.5v-3M12 16.5v-5M15 16.5v-2" />
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

/* ---------- CATÁLOGO E INGREDIENTES ---------- */

export function IconoIngredientes({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21c-1.4-2-2.2-4-2.2-6" />
      <path d="M10 14.2C6.8 13.6 4.6 11 4.2 7.8c3.2.2 5.8 2 6.8 5z" />
      <path d="M13.8 13c.4-3.4 2.8-6 5.8-6.8-.6 3.2-2.8 5.8-5.8 6.8z" />
    </S>
  );
}

export function IconoBebidas({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="7.5" y="3.5" width="9" height="17" rx="2.2" />
      <path d="M7.5 9h9" />
      <path d="M9.8 12.5v3" />
    </S>
  );
}

export function IconoInsignias({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="9.5" r="5.5" />
      <path d="M9 14.2 7.5 21l4.5-2.4 4.5 2.4-1.5-6.8" />
      <path d="m12 6.8.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2z" />
    </S>
  );
}

export function IconoReglas({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M9.5 18h5M10 21h4" />
      <path d="M12 3.5a6 6 0 0 1 3.8 10.6c-.7.6-1 1.2-1 1.9h-5.6c0-.7-.3-1.3-1-1.9A6 6 0 0 1 12 3.5z" />
    </S>
  );
}

export function IconoMasa({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M4.5 13.5c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5H4.5z" />
      <path d="M4.5 13.5c1.5 1.3 3.4 2 7.5 2s6-.7 7.5-2" />
      <path d="M7 10.2c1.5-.7 3.1-1 5-1s3.5.3 5 1" />
    </S>
  );
}

export function IconoOfertaNueva({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </S>
  );
}

/* ---------- ESTADOS, MENSAJES Y ACCIONES ---------- */

export function IconoAlerta({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 4 2.8 19.5h18.4L12 4z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </S>
  );
}

export function IconoBasura({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7" />
      <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
      <path d="M10.3 10v6.5M13.7 10v6.5" />
    </S>
  );
}

export function IconoCompra({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 3.5v8.5m0 0 3.2-3.2M12 12l-3.2-3.2" />
      <path d="M4 13.5v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
    </S>
  );
}

export function IconoConteo({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.7" />
      <path d="m8.8 12.6 2 2 4.4-4.4" />
    </S>
  );
}

export function IconoComprobante({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4V3.5z" />
      <path d="M9.5 8.5h5M9.5 12h5M9.5 15.5h3" />
    </S>
  );
}

export function IconoCandado({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.4" />
      <circle cx="12" cy="15.2" r="1.4" fill="currentColor" stroke="none" />
    </S>
  );
}

export function IconoGuardar({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M5 4.5h11l3 3v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" />
      <path d="M8 4.5V9h7V4.5" />
      <rect x="7.5" y="13" width="9" height="6.5" rx="0.8" />
    </S>
  );
}

export function IconoPin({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="m9 3.5 6 2-1.5 4.5 3 3.5H7.5l3-3.5L9 3.5z" />
      <path d="M12 13.5v7" />
    </S>
  );
}

export function IconoLupa({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.2 4.2" />
    </S>
  );
}

/* ---------- DATOS Y SECCIONES ---------- */

export function IconoUbicacion({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0 1 12 4.3a6.5 6.5 0 0 1 6.5 6.5C18.5 15.6 12 21 12 21z" />
      <circle cx="12" cy="10.6" r="2.2" />
    </S>
  );
}

export function IconoReloj({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </S>
  );
}

export function IconoCalendario({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
    </S>
  );
}

export function IconoCliente({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.8 20.2c1-3.4 3.8-5.4 7.2-5.4s6.2 2 7.2 5.4" />
    </S>
  );
}

export function IconoTrofeo({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M8 4h8v5.5a4 4 0 0 1-8 0V4z" />
      <path d="M8 5.5H5.2v1.8A3 3 0 0 0 8 10.3M16 5.5h2.8v1.8a3 3 0 0 1-2.8 3" />
      <path d="M12 13.5v3.5M9 20.5h6M10 17h4l.6 3.5h-5.2L10 17z" />
    </S>
  );
}

export function IconoMoneda({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2s1 1.7 2.8 2.2c1.8.5 2.9 1 2.9 2.4s-1.3 2.3-3 2.3c-1.5 0-2.6-.6-3.1-1.6" />
      <path d="M12 6.5v11" />
    </S>
  );
}

export function IconoTendencia({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M4 19.5h16" />
      <path d="m5.5 15 4-4.5 3.2 2.8 5.8-6.8" />
      <path d="M14.5 6.5h4v4" />
    </S>
  );
}

export function IconoTicket({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v1.8a1.9 1.9 0 0 0 0 3.4v1.8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 15.5v-1.8a1.9 1.9 0 0 0 0-3.4V8.5z" />
      <path d="M13.5 7v11" />
    </S>
  );
}

export function IconoBalanza({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 4.5v15" />
      <path d="M7.5 19.5h9" />
      <path d="M4.5 8.5h15" />
      <path d="M4.5 8.5 2.5 14h4l-2-5.5zM19.5 8.5 17.5 14h4l-2-5.5z" />
    </S>
  );
}

export function IconoEmpanadaLinea({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M4.2 14.8c0-4.6 3.4-8.3 7.8-8.3s7.8 3.7 7.8 8.3H4.2z" />
      <path d="M4.2 14.8c1.6 1.4 3.7 2.2 7.8 2.2s6.2-.8 7.8-2.2" />
      <path d="M8 11.5c1.2-.5 2.5-.8 4-.8s2.8.3 4 .8" />
    </S>
  );
}

export function IconoTienda({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="M4.5 10.5v9a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-9" />
      <path d="M3.5 10.5 5.2 4.5h13.6l1.7 6a2.6 2.6 0 0 1-5.2 0 2.6 2.6 0 0 1-5.2 0 2.6 2.6 0 0 1-5.2 0z" />
      <path d="M10 20.5v-5h4v5" />
    </S>
  );
}

export function IconoLineas({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="3.5" y="7.5" width="17" height="9" rx="4.5" />
      <circle cx="8.5" cy="12" r="2.4" />
      <path d="M14.5 12h3.5" />
    </S>
  );
}

export function IconoCamion({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="3.5" y="7" width="10.5" height="9" rx="1" />
      <path d="M14 10h3.2l2.8 3.2V16H14" />
      <circle cx="7.5" cy="18" r="1.8" />
      <circle cx="16.5" cy="18" r="1.8" />
    </S>
  );
}

export function IconoEstrella({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <path d="m12 4 2.3 4.8 5.2.7-3.8 3.6 1 5.2L12 15.8l-4.7 2.5 1-5.2L4.5 9.5l5.2-.7L12 4z" />
    </S>
  );
}

export function IconoIA({ size = 18, className }) {
  return (
    <S size={size} className={className}>
      <rect x="5" y="8" width="14" height="10" rx="2.5" />
      <path d="M12 8V5M9.5 5h5" />
      <circle cx="9.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M9.8 15.2h4.4" />
    </S>
  );
}
