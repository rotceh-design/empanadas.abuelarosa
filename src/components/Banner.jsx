import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCatalog } from '../contexts/CatalogContext';
import { combinacionesDelDia } from '../lib/daily';
import { fmtCLP } from '../lib/formato';
import { IconoEmpanada } from './Iconos';

// Icono ranking (podio simple) para el slide de más pedidas.
function IconoRanking({ size = 18, color = '#8b4513' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 21h10M12 17v4M6 4h12v5a6 6 0 0 1-12 0V4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Icono oferta ( etiqueta de precio) para los slides de combo.
function IconoOferta({ size = 18, color = '#8b4513' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="8" cy="8" r="1.6" fill={color} />
    </svg>
  );
}

// Banner promocional fijo (superior e inferior) — concepto vintage.
// Toda el área es pinchable (ejecuta la acción del slide activo).
// Arriba y abajo muestran slides desfasados para no repetir contenido.
export default function Banner({ posicion = 'top' }) {
  const navigate = useNavigate();
  const { stats, ofertas, settings, lineas, porId } = useCatalog();
  const [idx, setIdx] = useState(0);

  const delDia = combinacionesDelDia({ lineas, settings, porId });
  const individual = ofertas.find((o) => o.destacado === 'individual' && o.activa);
  const familiar = ofertas.find((o) => o.destacado === 'familiar' && o.activa);
  const ranking = Object.values(stats).sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 3);

  const slides = [];

  if (delDia.length) {
    slides.push({
      id: 'dia',
      icono: <IconoEmpanada size={18} color="#8b4513" />,
      titulo: 'Empanadas del día',
      detalle: `${delDia.length} opciones variadas`,
      precio: delDia[0].precio,
      cta: 'Ver',
      accion: () => navigate('/'),
    });
  }
  if (individual) {
    slides.push({
      id: 'individual',
      icono: <IconoOferta size={18} />,
      titulo: individual.nombre,
      detalle: `${individual.empanadas} emp + ${individual.bebidas} lata`,
      precio: individual.precio,
      cta: 'Armar',
      accion: () => navigate('/configurar'),
    });
  }
  if (familiar) {
    slides.push({
      id: 'familiar',
      icono: <IconoOferta size={18} />,
      titulo: familiar.nombre,
      detalle: `${familiar.empanadas} emp + ${familiar.bebidas} latas`,
      precio: familiar.precio,
      cta: 'Armar',
      accion: () => navigate('/configurar'),
    });
  }
  if (ranking.length) {
    slides.push({
      id: 'ranking',
      icono: <IconoRanking size={18} />,
      titulo: 'Las más pedidas',
      detalle: ranking.map((r, i) => `${i + 1}. ${r.nombre}`).join(' · '),
      cta: 'Ver',
      accion: () => navigate('/configurar'),
    });
  }

  const n = slides.length;
  const esTop = posicion === 'top';
  const desfase = esTop ? 0 : n > 1 ? 1 : 0; // arriba y abajo nunca el mismo slide a la vez

  useEffect(() => {
    if (n <= 1) return undefined;
    const t = setInterval(() => setIdx((v) => (v + 1) % n), 5200);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;
  const activo = slides[(idx + desfase) % n];

  return (
    <div
      onClick={activo.accion}
      className={`${esTop ? 'sticky top-0' : 'fixed inset-x-0 bottom-0'} h-12 cursor-pointer border-y border-[#4a2c17]/35 bg-[#f3e6c8] text-[#4a2c17]`}
      role="region"
      aria-label="Promociones"
    >
      <div className="mx-auto flex h-full max-w-5xl items-center gap-2 px-3">
        <div className="relative min-w-0 flex-1 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={activo.id + idx}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex min-w-0 items-center gap-1.5"
            >
              <span className="shrink-0" aria-hidden>{activo.icono}</span>
              <span className="vt-serif truncate text-[13px] font-bold leading-tight">
                <b className="uppercase tracking-wide">{activo.titulo}</b>
                {activo.detalle && <span className="hidden italic opacity-70 sm:inline"> · {activo.detalle}</span>}
                {activo.precio && (
                  <b className="vt-titulo ml-1.5 text-xs text-[#8b4513]">{fmtCLP(activo.precio)}</b>
                )}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); activo.accion(); }}
          className="vt-btn btn-tap shrink-0 rounded-full px-3 py-1.5 text-[11px]"
        >
          {activo.cta}
        </button>

        {n > 1 && (
          <div className="hidden shrink-0 items-center gap-1 sm:flex" aria-hidden>
            {slides.map((sl, i) => {
              const activoDot = (idx + desfase) % n === i;
              return (
                <button
                  key={sl.id}
                  onClick={(e) => { e.stopPropagation(); setIdx((i - desfase + n) % n); }}
                  aria-label={`Ir al slide ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full transition ${activoDot ? 'bg-[#4a2c17]' : 'bg-[#4a2c17]/30'}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
