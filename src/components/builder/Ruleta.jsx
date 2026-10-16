import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCatalog } from '../../contexts/CatalogContext';
import { IconosEmpanada } from '../Iconos';
import { fmtNum } from '../../lib/formato';

const BLOQUEOS = [
  { id: 'mar', label: 'Sin mariscos', test: (i) => i.tags?.includes('marisco') || i.tags?.includes('pescado') },
  { id: 'picante', label: 'Sin picante', test: (i) => i.tags?.includes('picante') },
  { id: 'verde', label: 'Sin hojas verdes', test: (i) => ['a_acelga', 'a_espinaca', 'a_albahaca'].includes(i.id) },
  { id: 'hongo', label: 'Sin champiñón', test: (i) => i.id === 'a_champinon' },
];

function comb(n, r) {
  if (r < 0 || r > n) return 0;
  const k = Math.min(r, n - r);
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return Math.round(c);
}

function kthCombinacion(k, n, r) {
  const res = [];
  let x = 0;
  for (let i = 0; i < r; i++) {
    for (let v = x; v < n; v++) {
      const c = comb(n - 1 - v, r - 1 - i);
      if (c <= k) k -= c;
      else { res.push(v); x = v + 1; break; }
    }
  }
  return res;
}

function poolLinea(l, bloqueados) {
  const combos = [];
  const nA = l.acompanamientos.length;
  const cant = l.cantidad ?? 0;
  const r = Math.min(cant, nA);
  const total = cant === 0 ? 1 : comb(nA, r);
  if (!l.proteinas.length || !l.quesos.length || total === 0) return combos;

  for (const proteina of l.proteinas) {
    for (const queso of l.quesos) {
      for (let k = 0; k < total; k++) {
        const acamps = (cant === 0 ? [] : kthCombinacion(k, nA, r)).map((i) => l.acompanamientos[i]);
        const partes = [proteina, queso, ...acamps];
        if (bloqueados.some((f) => partes.some(f))) continue;
        combos.push({ linea: l.id, proteina, queso, acamps, cantidad: acamps.length });
      }
    }
  }
  return combos;
}

export default function Ruleta({ dieta, bloqueos = [], aplicar, onAplicar, cerrar }) {
  const { porId } = useCatalog();
  const [giro, setGiro] = useState(false);

  const pool = useMemo(() => {
    const bloqueados = bloqueos.map((b) => BLOQUEOS.find((x) => x.id === b)?.test).filter(Boolean);
    return (aplicar?.lineas || []).flatMap((l) => poolLinea(l, bloqueados));
  }, [bloqueos, aplicar]);

  const elegido = useMemo(
    () => (pool.length ? pool[Math.floor(Math.random() * pool.length)] : null),
    [pool],
  );

  const girar = () => {
    if (giro || !elegido) return;
    setGiro(true);
    setTimeout(() => {
      onAplicar({
        linea: elegido.linea,
        proteina: elegido.proteina,
        queso: elegido.queso,
        acompanamientos: elegido.acamps,
        cantidad: elegido.cantidad,
      });
      setGiro(false);
      cerrar();
    }, 2100);
  };

  return (
    <div
      className="vt-modal-fondo fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onClick={cerrar}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="vt-modal w-full max-w-md rounded-3xl px-5 py-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sorpréndeme"
      >
        <h3 className="vt-titulo text-xl leading-tight">¡Sorpréndeme!</h3>
        <p className="vt-cuerpo mt-1 text-sm italic opacity-70">
          Te armamos una empanada al azar — de cualquiera de nuestras combinaciones.
        </p>

        <div className="mt-4">
          <p className="vt-serif mb-2 text-xs font-bold uppercase tracking-[0.18em] opacity-60">Dieta</p>
          <div className="flex flex-wrap gap-2">
            {[['todas', 'Todas'], ['vegetariana', 'Vegetariana'], ['vegana', 'Vegana']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => onAplicar({ dieta: id })}
                className={`btn-tap vt-serif rounded-full border-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wide ${
                  dieta === id ? 'vt-pestana-activa' : 'border-[#4a2c17]/25 bg-[#f7ecd4]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="vt-serif mb-2 text-xs font-bold uppercase tracking-[0.18em] opacity-60">Bloquear</p>
          <div className="flex flex-wrap gap-2">
            {BLOQUEOS.map((b) => {
              const activo = bloqueos.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => onAplicar({ bloqueo: b.id })}
                  className={`btn-tap vt-serif rounded-full border-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wide ${
                    activo ? 'vt-pestana-activa' : 'border-[#4a2c17]/25 bg-[#f7ecd4]'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border-2 border-dashed border-[#4a2c17]/35 bg-[#f7ecd4]/70 p-4 text-center">
          <motion.div
            animate={giro ? { y: [0, -14, 0, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: giro ? 4 : 0 }}
            className="space-y-1.5"
          >
            {giro ? (
              <p className="vt-titulo text-lg">Girando…</p>
            ) : elegido ? (
              <>
                <span className="inline-flex justify-center">
                  <IconosEmpanada
                    proteinaId={elegido.proteina.id}
                    quesoId={elegido.queso.id}
                    acompanamientosIds={elegido.acamps.map((a) => a.id)}
                    porId={porId}
                    size={20}
                  />
                </span>
                <p className="vt-serif text-base font-bold">
                  {elegido.proteina.nombre} + {elegido.queso.nombre}
                </p>
                <p className="vt-cuerpo text-xs italic opacity-60">
                  {elegido.acamps.map((a) => a.nombre).join(', ')}
                </p>
              </>
            ) : (
              <p className="vt-cuerpo text-sm italic opacity-70">
                Sin combinaciones con estos filtros — ajusta la dieta o los bloqueos.
              </p>
            )}
          </motion.div>
        </div>

        <p className="vt-cuerpo mt-3 text-center text-[11px] italic opacity-55">
          {pool.length > 0
            ? `Se sortean ${fmtNum(pool.length)} combinaciones · puedes editarla después`
            : ''}
        </p>

        <div className="mt-4 flex gap-3">
          <button onClick={cerrar} className="btn-tap vt-btn-fantasma flex-1 rounded-full py-3 text-xs">
            Cancelar
          </button>
          <button
            onClick={girar}
            disabled={giro || !elegido}
            className="btn-tap vt-btn flex-[2] rounded-full py-3 text-sm disabled:opacity-50"
          >
            {giro ? 'Girando…' : '¡Lanzar!'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export { BLOQUEOS };
