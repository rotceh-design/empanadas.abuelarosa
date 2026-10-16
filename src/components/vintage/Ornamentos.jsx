import logoAbuela from '../../assets/abuela-rosa.png';
import { IconoCandado } from '../Iconos';

/* Esquina ornamental vintage (curva con voluta) — se rota para las 4 esquinas */
export function Esquina({ className = '', size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" className={className} aria-hidden>
      <path
        d="M4 52 V14 Q4 4 14 4 H52"
        stroke="#4a2c17" strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d="M10 52 V18 Q10 10 18 10 H52"
        stroke="#4a2c17" strokeWidth="1.2" strokeLinecap="round" opacity="0.55"
      />
      <path
        d="M4 40 Q4 22 22 22 Q14 28 14 36 Q14 28 24 26"
        stroke="#4a2c17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle cx="18" cy="18" r="2" fill="#4a2c17" />
    </svg>
  );
}

/* Marco con las 4 esquinas + borde doble */
export function MarcoOrnamental({ children, className = '' }) {
  return (
    <div className={`vt-marco relative ${className}`}>
      <Esquina className="pointer-events-none absolute -left-1 -top-1" />
      <Esquina className="pointer-events-none absolute -right-1 -top-1 rotate-90" />
      <Esquina className="pointer-events-none absolute -right-1 -bottom-1 rotate-180" />
      <Esquina className="pointer-events-none absolute -left-1 -bottom-1 -rotate-90" />
      {children}
    </div>
  );
}

/* Floritura lateral tipo ala (como en la imagen) */
export function Floritura({ lado = 'izq', ancho = 90 }) {
  const flip = lado === 'der';
  return (
    <svg
      width={ancho} height={ancho * 0.72} viewBox="0 0 100 72" fill="none" aria-hidden
      className={flip ? '-scale-x-100' : ''}
    >
      <path
        d="M96 36 C70 36 58 18 42 18 C30 18 26 28 30 36 C26 28 14 26 8 34 C4 40 10 48 20 46 C14 52 20 62 32 58 C44 54 48 44 52 40 C60 46 76 48 96 44"
        stroke="#4a2c17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <path
        d="M88 36 C68 34 60 24 48 24 M84 40 C66 40 58 32 48 34"
        stroke="#4a2c17" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" fill="none"
      />
      <circle cx="14" cy="36" r="2.4" fill="#4a2c17" />
      <circle cx="26" cy="52" r="1.6" fill="#4a2c17" opacity="0.7" />
      <circle cx="24" cy="24" r="1.6" fill="#4a2c17" opacity="0.7" />
    </svg>
  );
}

/* Ornamento central "❋" con líneas (debajo del título) */
export function SeparadorOrnamental({ className = '' }) {
  return (
    <div className={`vt-separador ${className}`}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path d="M9 1 L10.5 7.5 L17 9 L10.5 10.5 L9 17 L7.5 10.5 L1 9 L7.5 7.5 Z" fill="#4a2c17" />
      </svg>
    </div>
  );
}

/* Sello circular "Empanadas Abuela Rosa" — solo el logo, sin anillos ni texto SVG */
export function SelloCircular({ size = 240, className = '' }) {
  return (
    <img
      src={logoAbuela}
      alt="Empanadas Abuela Rosa"
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* Sello grande de línea (Saladas / Dulces) */
export function SelloLinea({ titulo, subtitulo, icono, onClick, bloqueada = false, aviso = 'Próximamente' }) {
  if (bloqueada) {
    return (
      <div
        aria-disabled="true"
        className="vt-sello vt-serif group relative flex w-full max-w-[15.5rem] cursor-not-allowed flex-col items-center gap-1 rounded-full px-6 py-8 opacity-70 grayscale sm:max-w-none"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-[#4a2c17]/40"
        />
        <span className="relative flex h-14 w-14 items-center justify-center">
          {icono}
        </span>
        <span className="vt-serif relative mt-1 rounded-full border-2 border-[#8b4513]/40 bg-[#8b4513]/10 px-3 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-[#8b4513]">
          {aviso}
        </span>
        <span className="vt-titulo relative mt-2 text-center text-[1.35rem] leading-none sm:text-2xl">
          {titulo}
        </span>
        <span className="vt-cuerpo relative mt-1 text-sm italic opacity-75">{subtitulo}</span>
        <span className="vt-serif relative mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-[#4a2c17]/25 px-5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wide opacity-70">
          <IconoCandado size={14} /> Bloqueada
        </span>
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className="vt-sello btn-tap vt-serif group relative flex w-full max-w-[15.5rem] flex-col items-center gap-1 rounded-full px-6 py-8 sm:max-w-none">
      {/* Anillo interior decorativo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-[#4a2c17]/40"
      />
      <span className="relative flex h-14 w-14 items-center justify-center transition-transform duration-200 group-hover:scale-110">
        {icono}
      </span>
      <span className="vt-titulo relative mt-1 text-center text-[1.35rem] leading-none sm:text-2xl">
        {titulo}
      </span>
      <span className="vt-cuerpo relative mt-1 text-sm italic opacity-75">{subtitulo}</span>
      <span className="vt-btn-fantasma btn-tap relative mt-3 rounded-full px-5 py-1.5 text-[0.7rem]">
        Elegir
      </span>
    </button>
  );
}
