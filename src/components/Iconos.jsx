// ============================================
// Iconos SVG profesionales — estilo cocina.
// Trazos limpios, dos tonos (color + sombra/brillo).
// Sin emojis: cada ingrediente tiene su dibujo.
// ============================================

import empanadaImg from '../assets/empanada.png';

function S({ size = 24, className = '', children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

const oscuro = 'rgba(0,0,0,0.22)';
const claro = 'rgba(255,255,255,0.45)';

/* ---------- PROTEÍNAS ---------- */

export function IconoCarne({ size, color = '#B5402F', className }) {
  return (
    <S size={size} className={className}>
      <path d="M4 14.5c0-4.4 3.6-8 8-8s8 3.6 8 8v1.2c0 1.6-1.2 2.8-2.8 2.8H6.8C5.2 18.5 4 17.3 4 15.7v-1.2z" fill={color} />
      <path d="M6.5 12.5c.8-1.6 2-2.6 3.3-2.9M10 15.2c.7-1.4 1.9-2.3 3.2-2.5M14.2 12.8c.6-1 1.5-1.7 2.5-1.9" stroke={oscuro} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="8.2" cy="15.8" r="1" fill={oscuro} />
      <circle cx="12" cy="14.4" r="1" fill={oscuro} />
      <circle cx="15.4" cy="15.9" r="1" fill={oscuro} />
      <path d="M4 14.5c0-4.4 3.6-8 8-8 1.5 0 2.9.4 4.1 1.1C13.2 6.4 10 7.6 7.6 10.2 5.8 12.1 4.6 14.4 4.4 17.5" fill={claro} />
    </S>
  );
}

export function IconoCamaron({ size, color = '#E86A4F', className }) {
  return (
    <S size={size} className={className}>
      <path d="M17.5 4.8c-6.2-.4-11.3 3-11.3 8 0 3.2 2.2 5.7 5.3 5.7 2.3 0 4-1.2 4.7-3" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M16.2 15.5 19.6 19M16.2 15.5l.3 3.6" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="15.4" cy="6.6" r="1.2" fill={oscuro} />
      <path d="M9.4 11.4c1.6-.9 3.6-1.3 5.5-1.1" stroke={claro} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoPollo({ size, color = '#E0A040', className }) {
  return (
    <S size={size} className={className}>
      <ellipse cx="9.6" cy="9.2" rx="5.6" ry="4.6" transform="rotate(-38 9.6 9.2)" fill={color} />
      <path d="M12.8 12.4 16.6 16.2" stroke={oscuro} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="18.2" cy="17.6" r="2.2" fill="#F3EAD8" stroke={oscuro} strokeWidth="0.8" />
      <path d="M7.2 6.8c1.4-1 3-1.3 4.4-.9" stroke={claro} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoSoya({ size, color = '#4E9A51', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21v-9" stroke={oscuro} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13.5C8.7 13.5 6 10.9 6 7.6c3.5 0 6 2.6 6 5.9z" fill={color} />
      <path d="M12 11.5c3.2 0 5.8-2.5 5.8-5.7-3.4 0-5.8 2.5-5.8 5.7z" fill={color} opacity="0.8" />
      <path d="M12 13.5C8.7 13.5 6 10.9 6 7.6" stroke={oscuro} strokeWidth="1" fill="none" />
    </S>
  );
}

export function IconoReineta({ size, color = '#5B8CB8', className }) {
  return (
    <S size={size} className={className}>
      <ellipse cx="10.2" cy="12" rx="6.8" ry="4.4" fill={color} />
      <path d="M16.6 12l4.4-3.4v6.8L16.6 12z" fill={color} opacity="0.85" />
      <circle cx="6.6" cy="10.9" r="1.1" fill="#fff" />
      <circle cx="6.6" cy="10.9" r="0.55" fill={oscuro} />
      <path d="M11.4 8.4c.9 1.4.9 4 0 7.2" stroke={oscuro} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M8.2 9.8c2.4-.6 5-.5 7.2.4" stroke={claro} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </S>
  );
}

export function IconoSalmon({ size, color = '#F2836B', className }) {
  return (
    <S size={size} className={className}>
      <ellipse cx="10.2" cy="12" rx="6.8" ry="4.4" fill={color} />
      <path d="M16.6 12l4.4-3.4v6.8L16.6 12z" fill={color} opacity="0.85" />
      <circle cx="6.6" cy="10.9" r="1.1" fill="#fff" />
      <circle cx="6.6" cy="10.9" r="0.55" fill={oscuro} />
      <path d="M9.6 8.2c.9 1.2 1 2.6.3 3.8M12.6 8.4c.8 1.3.9 2.7.2 3.9M9.8 13c.8 1.2.9 2.5.2 3.7M12.8 12.9c.7 1.2.8 2.5.1 3.7" stroke={claro} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M12.6 7.6c.9-.4 1.9-.4 2.8 0" stroke={oscuro} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoSeitan({ size, color = '#B98B5E', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21V8.4" stroke={oscuro} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 9.4c-2.6 0-4.6-2-4.6-4.6 2.6 0 4.6 2 4.6 4.6z" fill={color} />
      <path d="M12 9.4c2.6 0 4.6-2 4.6-4.6-2.6 0-4.6 2-4.6 4.6z" fill={color} opacity="0.8" />
      <path d="M12 14.2c-2.6 0-4.6-2-4.6-4.6 2.6 0 4.6 2 4.6 4.6z" fill={color} opacity="0.9" />
      <path d="M12 14.2c2.6 0 4.6-2 4.6-4.6-2.6 0-4.6 2-4.6 4.6z" fill={color} opacity="0.7" />
      <path d="M12 19c-2.6 0-4.6-2-4.6-4.6 2.6 0 4.6 2 4.6 4.6z" fill={color} opacity="0.8" />
      <path d="M12 19c2.6 0 4.6-2 4.6-4.6-2.6 0-4.6 2-4.6 4.6z" fill={color} opacity="0.6" />
    </S>
  );
}

/* ---------- QUESOS ---------- */

export function IconoQuesoWedge({ size, color = '#F0B429', className, conHoja = false }) {
  return (
    <S size={size} className={className}>
      <path d="M3.5 17.2 13.8 5.6l6.7 4.4-3.6 8.2H4.2c-.5 0-.8-.4-.7-.9z" fill={color} />
      <path d="M13.8 5.6l6.7 4.4-1.1 2.5c-1.8-1-3.8-1.6-5.9-1.7l.3-5.2z" fill={claro} />
      <circle cx="9.4" cy="14.2" r="1.3" fill={claro} />
      <circle cx="13.6" cy="15.4" r="0.9" fill={claro} />
      {conHoja && (
        <path d="M15.5 5.2c1.8-1.6 4-1.8 5.4-1.4-.4 1.8-1.8 3.2-3.6 3.4l-1.8-2z" fill="#4E9A51" />
      )}
    </S>
  );
}

export function IconoMozzarella({ size, color = '#F6E27A', className }) {
  return (
    <S size={size} className={className}>
      <circle cx="11" cy="13" r="7.4" fill={color} />
      <path d="M11 5.6c2 1.6 3.2 4.2 3.2 7.4 0 1.6-.3 3.1-.8 4.4" fill={claro} />
      <path d="M16.5 7.5 20.4 5l1.2 3.8-3.4 1.9-1.7-3.2z" fill={color} opacity="0.9" />
      <circle cx="8.4" cy="11.2" r="1" fill={claro} />
      <circle cx="12.6" cy="15.4" r="0.8" fill={claro} />
    </S>
  );
}

/* ---------- ACOMPAÑAMIENTOS ---------- */

export function IconoTomate({ size, color = '#DC4B3E', className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="13.8" r="6.8" fill={color} />
      <path d="M8.2 9.6c1-1.6 2.6-2.6 4.4-2.8" stroke={claro} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M12 7V4.6" stroke="#3B7A3E" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 7c-1.6-1.4-3.4-1.8-4.8-1.6.6 1.5 2.4 2.4 4.8 2.4zm0 0c1.6-1.4 3.4-1.8 4.8-1.6-.6 1.5-2.4 2.4-4.8 2.4z" fill="#4E9A51" />
    </S>
  );
}

export function IconoChoclo({ size, color = '#F5C518', className }) {
  return (
    <S size={size} className={className}>
      <ellipse cx="12.4" cy="11.4" rx="4.4" ry="7" transform="rotate(18 12.4 11.4)" fill={color} />
      <path d="M10.4 7.4c1.4 2.4 2 5.4 1.6 8.4M13.4 6.6c1.2 2.6 1.6 5.6 1.2 8.6" stroke={oscuro} strokeWidth="0.9" fill="none" />
      <path d="M8.6 9.6c2.4.6 4.8.4 7-.6M8.8 12.8c2.4.6 4.9.4 7.2-.8M9.4 15.8c2 .5 4 .3 5.8-.6" stroke={oscuro} strokeWidth="0.9" fill="none" />
      <path d="M7.8 15.2C5.6 14 4.4 11.8 4.4 9.4c2.4.4 4.4 2 5.2 4.2" fill="#4E9A51" />
    </S>
  );
}

export function IconoChampinon({ size, color = '#A78B6F', className }) {
  return (
    <S size={size} className={className}>
      <path d="M3.6 12.2c0-4.6 3.8-8 8.4-8s8.4 3.4 8.4 8H3.6z" fill={color} />
      <path d="M9.8 12.2h4.4v5.2c0 1.5-1 2.6-2.2 2.6s-2.2-1.1-2.2-2.6v-5.2z" fill={color} opacity="0.75" />
      <path d="M6.5 10.4c.8-1.8 2.2-3 4-3.5" stroke={claro} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M8.4 12.2h1M12 12.2h1M15 12.2h1" stroke={oscuro} strokeWidth="1" strokeLinecap="round" />
    </S>
  );
}

export function IconoPalmitos({ size, color = '#DCCBA4', className }) {
  return (
    <S size={size} className={className}>
      <rect x="6.4" y="4.4" width="3" height="15.2" rx="1.5" fill={color} transform="rotate(-8 6.4 4.4)" />
      <rect x="10.5" y="3.8" width="3" height="15.8" rx="1.5" fill={color} />
      <rect x="14.6" y="4.4" width="3" height="15.2" rx="1.5" fill={color} transform="rotate(8 14.6 4.4)" />
      <rect x="5.6" y="10.6" width="12.8" height="2.6" rx="1.2" fill={oscuro} />
    </S>
  );
}

export function IconoPimenton({ size, color = '#C96A20', className }) {
  return (
    <S size={size} className={className}>
      <path d="M8.2 8.4c-2.6 1.2-4.2 3.6-4.2 6.2 0 3.4 3.2 5.6 8 5.6s8-2.2 8-5.6c0-2.6-1.6-5-4.2-6.2-.6-1.6-1.8-2.6-3.8-2.6s-3.2 1-3.8 2.6z" fill={color} />
      <path d="M12 5.6v3" stroke="#3B7A3E" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 5.6c-1.2-1-2.6-1.3-3.8-1.1.4 1.2 1.8 2 3.8 2zm0 0c1.2-1 2.6-1.3 3.8-1.1-.4 1.2-1.8 2-3.8 2z" fill="#4E9A51" />
      <path d="M8 11.5c.6-1.2 1.6-2 2.8-2.2" stroke={claro} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoAceituna({ size, color = '#5B6B4A', className }) {
  return (
    <S size={size} className={className}>
      <ellipse cx="11.4" cy="13.4" rx="6" ry="7" transform="rotate(-18 11.4 13.4)" fill={color} />
      <ellipse cx="11.4" cy="13.4" rx="2.4" ry="3" transform="rotate(-18 11.4 13.4)" fill={oscuro} />
      <path d="M14.6 5.6c1.8-1.4 3.8-1.6 5-1.2-.4 1.6-1.8 2.8-3.4 3l-1.6-1.8z" fill="#4E9A51" />
      <path d="M13.2 6.4 11.6 9" stroke="#3B7A3E" strokeWidth="1.3" strokeLinecap="round" />
    </S>
  );
}

export function IconoAlbahaca({ size, color = '#3B7A3E', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21c-1.6-2-2.4-4.2-2.4-6.4" stroke={oscuro} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M9.8 15C6.4 14.4 4 11.6 3.6 8c3.4.2 6.2 2.2 7.2 5.4z" fill={color} />
      <path d="M14.4 13.8c.4-3.8 3-6.6 6.4-7.4-.6 3.6-3 6.4-6.4 7.4z" fill={color} opacity="0.82" />
      <path d="M5.2 9.4c1.8.4 3.4 1.4 4.4 2.8M16.2 8.6c-1.4.8-2.6 2-3.2 3.4" stroke={oscuro} strokeWidth="0.9" fill="none" />
    </S>
  );
}

export function IconoAcelga({ size, color = '#2F6B33', className }) {
  return (
    <S size={size} className={className}>
      <path d="M11 21.4c-1-3-1.4-6-1.2-9" stroke="#E8E0C8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9.8 12.4C6 11.6 3.2 8.6 2.8 4.8c3.8.4 6.8 2.8 7.6 6.4z" fill={color} />
      <path d="M10.6 11.2c.6-4 3.4-6.8 7-7.6-.2 3.8-2.8 6.8-6.4 7.8z" fill={color} opacity="0.8" />
      <path d="M4.8 6.6c1.6.8 3 2 3.8 3.6M13.6 5.8c-1.2 1-2.2 2.4-2.8 4" stroke={oscuro} strokeWidth="0.9" fill="none" />
    </S>
  );
}

export function IconoEspinaca({ size, color = '#4E8B3A', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21.2v-8" stroke={oscuro} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 13.2C7.6 13.2 4.4 9.8 4.4 5.4c4.4 0 7.6 3.2 7.6 7.8z" fill={color} />
      <path d="M12 13.2c4.4 0 7.6-3.4 7.6-7.8-4.4 0-7.6 3.4-7.6 7.8z" fill={color} opacity="0.82" />
      <path d="M6.4 7.4c1.8 1 3.2 2.6 4 4.4M17.6 7.4c-1.8 1-3.2 2.6-4 4.4" stroke={oscuro} strokeWidth="0.9" fill="none" />
    </S>
  );
}

export function IconoCebolla({ size, color = '#B0742A', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21c-4.4 0-7.6-3.4-7.6-7.6S7.6 5.8 12 5.8s7.6 3.4 7.6 7.6S16.4 21 12 21z" fill={color} />
      <path d="M12 5.8C10.4 8.6 9.6 12 9.8 15.6M12 5.8c1.6 2.8 2.4 6.2 2.2 9.8M8.4 7.4C7.2 10 6.6 13 6.8 16M15.6 7.4c1.2 2.6 1.8 5.6 1.6 8.6" stroke={oscuro} strokeWidth="0.95" fill="none" />
      <path d="M12 5.8V3M12 5.4 9.8 3.2M12 5.4l2.2-2.2" stroke="#3B7A3E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M8.2 9.6c.8-1.2 1.8-2 3-2.4" stroke={claro} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoZapallo({ size, color = '#7FA650', className }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="12" r="8.2" fill={color} />
      <circle cx="12" cy="12" r="5.6" fill={claro} />
      <ellipse cx="12" cy="10.4" rx="1" ry="1.4" fill={oscuro} />
      <ellipse cx="10" cy="13.4" rx="0.9" ry="1.2" fill={oscuro} />
      <ellipse cx="14" cy="13.4" rx="0.9" ry="1.2" fill={oscuro} />
    </S>
  );
}

/* ---------- DULCE ---------- */

export function IconoQuesoFresco({ size, color = '#F6E27A', className }) {
  return (
    <S size={size} className={className}>
      <rect x="4.2" y="7.4" width="15.6" height="10.4" rx="2.6" fill={color} />
      <path d="M4.2 11.2h15.6" stroke={claro} strokeWidth="1.4" />
      <circle cx="9" cy="14.6" r="1" fill={claro} />
      <circle cx="14.4" cy="15.2" r="0.8" fill={claro} />
      <path d="M7 7.4c.4-1.6 1.4-2.6 2.6-2.6" stroke={oscuro} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoManjar({ size, color = '#E8B563', className }) {
  return (
    <S size={size} className={className}>
      <path d="M6.6 10h10.8l-1 8.2c-.2 1.4-1.2 2.2-2.6 2.2h-3.6c-1.4 0-2.4-.8-2.6-2.2L6.6 10z" fill={color} />
      <ellipse cx="12" cy="10" rx="5.4" ry="1.8" fill={color} />
      <ellipse cx="12" cy="10" rx="3.6" ry="1" fill={oscuro} />
      <path d="M15.5 4.6c1.6 1.4 2.4 3 2.4 4.8" stroke="#8B5E34" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M9.4 13.4c.8 1.6 1 3.2.6 4.8" stroke={claro} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoNuez({ size, color = '#8B5E34', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21c-4 0-7-3-7-6.8 0-2.6 1.4-4.6 3.4-5.4-.2-1.2.4-2.4 1.6-3 1-.5 2.2-.3 3 .6.8-.9 2-1.1 3-.6 1.2.6 1.8 1.8 1.6 3 2 .8 3.4 2.8 3.4 5.4 0 3.8-3 6.8-7 6.8z" fill={color} />
      <path d="M12 6.4v14.2M8.6 9.4c1 .8 1.6 2 1.8 3.4M15.4 9.4c-1 .8-1.6 2-1.8 3.4" stroke={oscuro} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M9.6 15.4c1.4.8 3.4.8 4.8 0" stroke={claro} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </S>
  );
}

export function IconoAlmendra({ size, color = '#C89B6A', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21c-3.8 0-6.4-3.4-6.4-8S8.6 3.6 12 3.6s6.4 4.6 6.4 9.4-2.6 8-6.4 8z" fill={color} />
      <path d="M12 5.4v13.6" stroke={oscuro} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9.4 8.4c.8 1.4 1.2 3 1.2 4.8M14.6 8.4c-.8 1.4-1.2 3-1.2 4.8" stroke={claro} strokeWidth="1" fill="none" strokeLinecap="round" />
    </S>
  );
}

export function IconoCanela({ size, color = '#9C5F2B', className }) {
  return (
    <S size={size} className={className}>
      <rect x="8.2" y="5.6" width="7.6" height="14.4" rx="3.4" transform="rotate(14 8.2 5.6)" fill={color} />
      <ellipse cx="10.8" cy="6.6" rx="3.2" ry="1.8" transform="rotate(14 10.8 6.6)" fill={oscuro} />
      <ellipse cx="10.8" cy="6.6" rx="1.6" ry="0.9" transform="rotate(14 10.8 6.6)" fill={claro} />
      <path d="M12.4 10.2c.6 1.4.9 2.9.8 4.4" stroke={claro} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoArandano({ size, color = '#5B4B8A', className }) {
  return (
    <S size={size} className={className}>
      <circle cx="8.6" cy="14.6" r="4" fill={color} />
      <circle cx="15.4" cy="14.6" r="4" fill={color} opacity="0.88" />
      <circle cx="12" cy="9.8" r="4" fill={color} opacity="0.94" />
      <path d="M12 5.6V3.4M12 5.6c1.4-1.2 3-1.6 4.4-1.4-.4 1.4-1.8 2.4-3.4 2.6" stroke="#3B7A3E" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="7.2" cy="13.2" r="1" fill={claro} />
      <circle cx="10.8" cy="8.6" r="1" fill={claro} />
    </S>
  );
}

export function IconoChocolate({ size, color = '#5C3A21', className }) {
  return (
    <S size={size} className={className}>
      <rect x="4.4" y="5.4" width="15.2" height="13.6" rx="2" fill={color} />
      <path d="M12 5.4v13.6M4.4 12h15.2" stroke={claro} strokeWidth="1.2" />
      <rect x="5.6" y="6.6" width="5" height="4.2" rx="0.8" fill={claro} opacity="0.5" />
    </S>
  );
}

export function IconoDulceDeLeche({ size, color = '#B8742C', className }) {
  return (
    <S size={size} className={className}>
      <ellipse cx="12" cy="16.8" rx="6.6" ry="3.4" fill={color} />
      <path d="M5.4 16.8c0-1.9 3-3.4 6.6-3.4s6.6 1.5 6.6 3.4" fill={color} />
      <path d="M12 13.4V7.6" stroke="#8B5E34" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="12" cy="6.4" rx="3" ry="2" fill={color} />
      <path d="M9.2 16.8c1.2.8 4.4.8 5.6 0" stroke={claro} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoMembrillo({ size, color = '#C4453B', className }) {
  return (
    <S size={size} className={className}>
      <rect x="4.6" y="7.2" width="14.8" height="11.2" rx="2.4" fill={color} />
      <path d="M4.6 11h14.8" stroke={claro} strokeWidth="1.3" />
      <path d="M8.4 7.2c.3-1.6 1.5-2.8 3-2.8 1.8 0 2.8 1.2 3.2 2.8" stroke="#3B7A3E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="14.6" r="1" fill={claro} />
      <circle cx="14.4" cy="15.4" r="0.8" fill={claro} />
      <circle cx="12" cy="12.8" r="0.7" fill={claro} />
    </S>
  );
}

export function IconoFrutosRojos({ size, color = '#C23B4E', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21c-3.8 0-6.6-2.6-6.6-6 0-2.2 1.4-3.8 3-4.4.6-1.6 1.8-2.6 3.6-2.6s3 1 3.6 2.6c1.6.6 3 2.2 3 4.4 0 3.4-2.8 6-6.6 6z" fill={color} />
      <path d="M9.8 7.4c.7-.4 1.5-.6 2.2-.6s1.5.2 2.2.6" stroke="#3B7A3E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 6.8V4.4M12 6.2c1-.9 2.2-1.2 3.2-1-.3 1-1.3 1.8-2.6 2M12 6.2c-1-.9-2.2-1.2-3.2-1 .3 1 1.3 1.8 2.6 2" stroke="#4E9A51" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="9.6" cy="12.6" r="0.8" fill={claro} />
      <circle cx="13.8" cy="13.4" r="0.7" fill={claro} />
      <circle cx="11.6" cy="15.8" r="0.7" fill={claro} />
    </S>
  );
}

export function IconoPinon({ size, color = '#8B5E34', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 3.6c2.6 0 4.4 2 4.4 4.6 0 1.8-.8 3-1.6 4.2-.6.9-1 1.8-1 3v1.4c0 1.8-1 3.2-1.8 3.2s-1.8-1.4-1.8-3.2v-1.4c0-1.2-.4-2.1-1-3C7.4 10.6 6.6 9.4 6.6 7.6c0-2.6 1.8-4.6 4.4-4.6z" fill={color} />
      <path d="M12 5.4v13.4" stroke={oscuro} strokeWidth="1" fill="none" />
      <path d="M9.8 8.2c.8.6 1.4 1.5 1.6 2.6M14.2 8.2c-.8.6-1.4 1.5-1.6 2.6" stroke={claro} strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoAzucar({ size, color = '#F6E27A', className }) {
  return (
    <S size={size} className={className}>
      <path d="M4.8 12.4h14.4c0 3.6-2.6 6.4-7.2 6.4s-7.2-2.8-7.2-6.4z" fill={color} />
      <path d="M4.8 12.4c0-1.4 3.2-2.4 7.2-2.4s7.2 1 7.2 2.4" fill={claro} />
      <path d="M6.6 15.6h10.8" stroke={oscuro} strokeWidth="0.9" fill="none" />
      <path d="M9.2 6.2l.5 1.2M12 4.8l.4 1.2M14.8 6.2l-.5 1.2" stroke={oscuro} strokeWidth="1" strokeLinecap="round" />
      <circle cx="9" cy="9.4" r="0.6" fill={claro} />
      <circle cx="15" cy="9" r="0.6" fill={claro} />
    </S>
  );
}

export function IconoCoco({ size, color = '#8B5E34', className }) {
  return (
    <S size={size} className={className}>
      <path d="M3.8 12.8c0-4.6 3.6-8.2 8.2-8.2s8.2 3.6 8.2 8.2c0 .8-.2 1.4-.4 2H4.2c-.2-.6-.4-1.2-.4-2z" fill={color} />
      <path d="M4.6 15.2h14.8c-.8 2-3 3.6-6 3.6h-2.8c-3 0-5.2-1.6-6-3.6z" fill="#F3EAD8" />
      <circle cx="9.2" cy="10.6" r="1" fill={oscuro} />
      <circle cx="14.2" cy="10.2" r="0.8" fill={oscuro} />
      <circle cx="11.8" cy="7.8" r="0.7" fill={oscuro} />
      <path d="M7 12c1-.8 2.4-1.2 3.8-1.1" stroke={claro} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoPina({ size, color = '#E8C220', className }) {
  return (
    <S size={size} className={className}>
      <path d="M12 21c-2.8 0-5-2.4-5-5.6 0-2 1-3.6 2.2-4.8.5-1.4 1.5-2.4 2.8-2.4s2.3 1 2.8 2.4c1.2 1.2 2.2 2.8 2.2 4.8 0 3.2-2.2 5.6-5 5.6z" fill={color} />
      <path d="M12 8.2V4.2M12 6.6c1-1.2 2.4-1.8 3.6-1.6-.2 1.2-1.2 2.2-2.6 2.6M12 6.6c-1-1.2-2.4-1.8-3.6-1.6.2 1.2 1.2 2.2 2.6 2.6" stroke="#3B7A3E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M9.4 11.4l5.2 5.2M14.6 11.4l-5.2 5.2M12 10.4v7.6" stroke={oscuro} strokeWidth="0.9" opacity="0.5" />
    </S>
  );
}

export function IconoMango({ size, color = '#F09030', className }) {
  return (
    <S size={size} className={className}>
      <path d="M16.4 5.8c2.4 1.4 3.4 4.6 2.2 7.6-1.4 3.6-4.8 6-8 6-2.2 0-3.6-1-3.6-2.4 0-1 .6-1.8 1.6-2.2 2.6-1 4.4-2.6 5.4-4.8.6-1.4.8-3 .4-4.2-.2-.6.6-1 2 0z" fill={color} />
      <path d="M10.6 14.8c-1.4.2-2.6 0-3.4-.6" stroke={claro} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M12.8 7.2c.8-1.4 2-2.2 3.4-2.4" stroke="#3B7A3E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="14.6" cy="10.4" r="0.8" fill={claro} />
    </S>
  );
}

export function IconoFrutosSecos({ size, color = '#A67C52', className }) {
  return (
    <S size={size} className={className}>
      <ellipse cx="8" cy="13.6" rx="3.4" ry="4.4" fill={color} transform="rotate(-18 8 13.6)" />
      <ellipse cx="15.4" cy="13" rx="3" ry="4" fill={color} transform="rotate(16 15.4 13)" opacity="0.85" />
      <ellipse cx="11.6" cy="8.2" rx="2.6" ry="3.4" fill={color} transform="rotate(6 11.6 8.2)" opacity="0.95" />
      <path d="M6.6 12.2c.4 1.4 1 2.4 1.8 3M14.4 11.4c.3 1.2.8 2.2 1.5 3M10.8 7c.4 1.2.9 2 1.5 2.8" stroke={claro} strokeWidth="1" strokeLinecap="round" fill="none" />
    </S>
  );
}

export function IconoChocolateBar({ size, color = '#5C3A21', className }) {
  return (
    <S size={size} className={className}>
      <rect x="4.8" y="6.4" width="14.4" height="12.4" rx="1.8" fill={color} />
      <path d="M9.6 6.4v12.4M14.4 6.4v12.4M4.8 10.6h14.4M4.8 14.8h14.4" stroke={claro} strokeWidth="1" opacity="0.55" />
      <rect x="4.8" y="6.4" width="14.4" height="3" rx="1.4" fill={claro} opacity="0.2" />
    </S>
  );
}

export function IconoNutella({ size, color = '#6B3E26', className }) {
  return (
    <S size={size} className={className}>
      <rect x="5.4" y="8" width="13.2" height="11.6" rx="2.2" fill={color} />
      <rect x="4.6" y="5.2" width="14.8" height="3.4" rx="1.4" fill="#D94E3D" />
      <rect x="7.2" y="11.4" width="9.6" height="5" rx="1.2" fill={claro} opacity="0.85" />
      <path d="M9 13.8c1-.8 2-1.1 3-1.1s2 .3 3 1.1" stroke={color} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="15.4" r="0.9" fill={color} />
    </S>
  );
}

export function IconoMani({ size, color = '#C49A6C', className }) {
  return (
    <S size={size} className={className}>
      <path d="M8.6 4.8c1.8 0 3 1.4 3.4 3 .5 1.8 1 2.6 1.8 3.4.8.8 1.4 1.6 1.4 3 0 2.4-1.8 4.2-4 4.2-1.6 0-2.6-.8-3.2-2-.5-1-1.4-1.6-2.4-1.8-1.6-.4-2.6-1.6-2.6-3.2 0-1.2.6-2.2 1.6-2.6.8-.3 1.4-1 1.6-2 .4-1.4 1-2 2.4-2z" fill={color} />
      <path d="M8.2 7.6c.8 1 1.2 2.2 1.2 3.6M12.6 13.2c-.2 1.2-.6 2.2-1.2 3" stroke={oscuro} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
      <ellipse cx="9.4" cy="11.2" rx="1" ry="1.4" fill={claro} opacity="0.5" transform="rotate(-20 9.4 11.2)" />
    </S>
  );
}

export function IconoMermelada({ size, color = '#5B4B8A', className }) {
  return (
    <S size={size} className={className}>
      <rect x="5.6" y="8.4" width="12.8" height="11" rx="2.2" fill={color} />
      <rect x="4.8" y="5.6" width="14.4" height="3.4" rx="1.4" fill="#7A68B0" />
      <circle cx="9.6" cy="13.4" r="1.4" fill="#3E3360" />
      <circle cx="13.8" cy="12.6" r="1.1" fill="#3E3360" />
      <circle cx="11.8" cy="16" r="1.2" fill="#3E3360" />
      <circle cx="14.4" cy="15.6" r="0.8" fill="#3E3360" />
      <path d="M7.6 18.2h8.8" stroke={claro} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </S>
  );
}

export function IconoChancaca({ size, color = '#8A5A2B', className }) {
  return (
    <S size={size} className={className}>
      <path d="M5 9.2c0-1 .8-1.8 1.8-1.8h10.4c1 0 1.8.8 1.8 1.8v7.6c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8V9.2z" fill={color} />
      <path d="M5 11.4h14" stroke={oscuro} strokeWidth="1" opacity="0.45" />
      <path d="M8.4 7.4V5.8M12 7.4V5.2M15.4 7.4V6" stroke={claro} strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <rect x="7.4" y="13.2" width="3.4" height="2.6" rx="0.7" fill={claro} opacity="0.3" />
    </S>
  );
}

/* ---------- BEBIDAS ---------- */

export function IconoLata({ size = 24, color = '#DC4B3E', className }) {
  return (
    <S size={size} className={className}>
      <rect x="6.4" y="3.6" width="11.2" height="16.8" rx="2.4" fill="#C9CDD4" />
      <rect x="6.4" y="8.2" width="11.2" height="7.6" fill={color} />
      <path d="M8.8 5.2h6.4" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.6 9.8v4.4" stroke={claro} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13.4" cy="11.2" r="1.2" fill={claro} />
      <circle cx="13.4" cy="13.6" r="0.8" fill={claro} />
    </S>
  );
}

/* ---------- UI ---------- */

export function IconoCarrito({ size = 22, className, color = 'currentColor' }) {
  return (
    <S size={size} className={className}>
      <path d="M3.2 4.4h2.2l2.2 10.4h9.6l2-7.2H6.6" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.4" cy="19" r="1.6" fill={color} />
      <circle cx="16.2" cy="19" r="1.6" fill={color} />
    </S>
  );
}

export function IconoLuna({ size = 20, className, color = 'currentColor' }) {
  return (
    <S size={size} className={className}>
      <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.6 8.6 0 1 0 20 14.4z" fill="none" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
    </S>
  );
}

export function IconoSol({ size = 20, className, color = 'currentColor' }) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke={color} strokeWidth="1.9" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </S>
  );
}

export function IconoEmpanada({ size = 22, className = '' }) {
  return (
    <img
      src={empanadaImg}
      alt="Empanada"
      draggable={false}
      style={{ width: size, height: size }}
      className={`select-none object-contain ${className}`}
    />
  );
}

export function IconoDulce({ size = 22, className, color = '#B8742C' }) {
  return (
    <S size={size} className={className}>
      <path d="M8.5 8.5c1.8-1.8 5.2-1.8 7 0s1.8 5.2 0 7-5.2 1.8-7 0-1.8-5.2 0-7z" fill={color} />
      <path d="M9.5 9.5c1.2-1.2 3.8-1.2 5 0s1.2 3.8 0 5" stroke={claro} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M8.5 8.5L5 5.5c-.7-.6-1.8-.4-2.2.4-.3.6-.1 1.3.4 1.8L6.2 9.8M15.5 15.5L19 18.5c.7.6 1.8.4 2.2-.4.3-.6.1-1.3-.4-1.8L17.8 14.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M8.5 15.5L5 18.5c-.7.6-1.8.4-2.2-.4-.3-.6-.1-1.3.4-1.8L6.2 14.2M15.5 8.5L19 5.5c.7-.6 1.8-.4 2.2.4.3.6.1 1.3-.4 1.8L17.8 9.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="12" r="1.6" fill={claro} opacity="0.8" />
    </S>
  );
}

/* ---------- MAPEO POR ID ---------- */

const MAPA = {
  p_carne: IconoCarne,
  p_camaron: IconoCamaron,
  p_pollo: IconoPollo,
  p_soya: IconoSoya,
  p_seitan: IconoSeitan,
  p_reineta: IconoReineta,
  p_salmon: IconoSalmon,
  q_gouda: (p) => <IconoQuesoWedge {...p} />,
  q_llanero: (p) => <IconoQuesoWedge {...p} color={p.color || '#E58A22'} />,
  q_vegano: (p) => <IconoQuesoWedge {...p} conHoja />,
  q_mozzarella: IconoMozzarella,
  d_nutella: IconoNutella,
  d_chocolate: IconoChocolateBar,
  d_manjar: IconoManjar,
  d_membrillo: IconoMembrillo,
  d_choclo: (p) => <IconoChoclo {...p} />,
  d_pina: IconoPina,
  d_mango: IconoMango,
  d_frutos: IconoFrutosRojos,
  d_frutossecos: IconoFrutosSecos,
  d_coco: IconoCoco,
  d_almendra: IconoAlmendra,
  d_nuez: IconoNuez,
  d_mani: IconoMani,
  d_mermelada: IconoMermelada,
  d_chancaca: IconoChancaca,
  a_tomate: IconoTomate,
  a_choclo: IconoChoclo,
  a_champinon: IconoChampinon,
  a_palmitos: IconoPalmitos,
  a_pimenton: IconoPimenton,
  a_aceituna: IconoAceituna,
  a_albahaca: IconoAlbahaca,
  a_acelga: IconoAcelga,
  a_espinaca: IconoEspinaca,
  a_cebolla: IconoCebolla,
  a_zapallo: IconoZapallo,
  b_coca: (p) => <IconoLata {...p} color="#DC4B3E" />,
  b_fanta: (p) => <IconoLata {...p} color="#F07613" />,
  b_sprite: (p) => <IconoLata {...p} color="#6FBF73" />,
  b_agua: (p) => <IconoLata {...p} color="#5B8CB8" />,
  b_jugo: (p) => <IconoLata {...p} color="#E8A020" />,
};

const GENERICO = {
  proteina: IconoCarne,
  queso: (p) => <IconoQuesoWedge {...p} />,
  acompanamiento: IconoEspinaca,
  bebida: IconoLata,
};

// Icono de ingrediente/bebida a partir del objeto del catálogo ({ id, color, categoria }).
export function IconoIngrediente({ ing, size = 22, className = '' }) {
  if (!ing) return null;
  const Dibujo = MAPA[ing.id] || GENERICO[ing.categoria] || IconoEmpanada;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      <Dibujo size={size} color={ing.color} />
    </span>
  );
}

// Fila de iconos de una empanada (proteína, queso y acompañamientos).
export function IconosEmpanada({ proteinaId, quesoId, acompanamientosIds = [], porId, size = 18 }) {
  const ids = [proteinaId, quesoId, ...acompanamientosIds].filter(Boolean);
  return (
    <span className="inline-flex items-center gap-1">
      {ids.map((id, i) => (
        <IconoIngrediente key={`${id}-${i}`} ing={porId?.[id] || { id }} size={size} />
      ))}
    </span>
  );
}
