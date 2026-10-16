import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { IconoIngrediente } from './Iconos';
import empanadaImg from '../assets/empanada.png';

// Empanada visual por capas: masa → relleno → acompañamientos flotando.
export default function EmpanadaVisual({ proteina, queso, acompanamientos = [], ancho = 220, modo = 'arma' }) {
  const ingredientes = useMemo(() => {
    const lista = [];
    if (proteina) lista.push({ ...proteina, key: `p-${proteina.id}`, tipo: 'proteina' });
    if (queso) lista.push({ ...queso, key: `q-${queso.id}`, tipo: 'queso' });
    acompanamientos.forEach((a, i) => lista.push({ ...a, key: `a-${a.id}-${i}`, tipo: 'acomp' }));
    return lista;
  }, [proteina, queso, acompanamientos]);

  const relleno = ingredientes.length;

  return (
    <div
      className="relative select-none"
      style={{ width: ancho, height: ancho * 0.78 }}
      aria-label={`Empanada con ${relleno} ingredientes`}
    >
      {/* Halo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(240,118,19,0.35), transparent 65%)' }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Plato */}
      <div className="absolute bottom-1 left-1/2 h-4 w-[86%] -translate-x-1/2 rounded-[50%] bg-tierra-700/25 blur-[2px]" />

      {/* Masa */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: modo === 'arma' ? [0, 1.5, -1.5, 0] : 0 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={empanadaImg}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ width: ancho, height: 'auto' }}
          className="drop-shadow-[0_8px_14px_rgba(74,53,32,0.35)]"
        />
      </motion.div>

      {/* Ingredientes flotando sobre la masa (solo en modo interactivo) */}
      {modo !== 'display' && (
      <div className="absolute inset-0">
        <AnimatePresence>
          {ingredientes.map((ing, i) => {
            const total = ingredientes.length;
            const ang = (i / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
            const radio = 46;
            const x = Math.cos(ang) * radio;
            const y = Math.sin(ang) * (radio * 0.62);
            return (
              <motion.div
                key={ing.key}
                className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full shadow-puff"
                style={{
                  background: `${ing.color || '#F07613'}22`,
                  border: `2px solid ${ing.color || '#F07613'}`,
                  width: 40,
                  height: 40,
                }}
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, x: x - 20, y: y - 20, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.2 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                <IconoIngrediente ing={ing} size={22} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      )}

      {relleno === 0 && (
        <div className="absolute inset-x-0 bottom-0 text-center text-sm font-bold text-tierra-500 dark:text-crema-300">
          Empieza a armar tu empanada 👇
        </div>
      )}
    </div>
  );
}
