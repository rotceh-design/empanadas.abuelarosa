import { useState } from 'react';
import { motion } from 'framer-motion';
import { recomendar } from '../../lib/ia';

const PREGUNTAS = [
  { id: 'vegetariana', titulo: '¿Quieres algo vegetariano?', emoji: '🌿', opciones: [{ v: true, l: 'Sí 🌱' }, { v: false, l: 'No, con carne o pescado' }] },
  { id: 'favorito', titulo: '¿Qué sabor te gusta más?', emoji: '😋', opciones: [{ v: 'tomate', l: '🍅 Tomate' }, { v: 'choclo', l: '🌽 Choclo' }, { v: 'cebolla', l: '🧅 Cebolla' }, { v: 'champiñón', l: '🍄 Champiñón' }, { v: 'queso', l: '🧀 Queso' }] },
  { id: 'picante', titulo: '¿Picante o suave?', emoji: '🌶️', opciones: [{ v: true, l: '🔥 Picante' }, { v: false, l: '😌 Suave' }] },
];

export default function Recomendador({ onElegir }) {
  const [paso, setPaso] = useState(0);
  const [resp, setResp] = useState({});
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const responder = async (valor) => {
    const key = PREGUNTAS[paso].id;
    const nuevas = { ...resp, [key]: valor };
    setResp(nuevas);
    if (paso < PREGUNTAS.length - 1) { setPaso(paso + 1); return; }
    setCargando(true);
    const r = await recomendar(nuevas);
    setResultados(r);
    setCargando(false);
  };

  if (cargando) {
    return (
      <div className="rounded-3xl border border-naranja-400/40 bg-naranja-400/10 p-6 text-center">
        <motion.p className="text-4xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>👨‍🍳</motion.p>
        <p className="mt-2 font-display font-extrabold">Nuestro chef está pensando…</p>
      </div>
    );
  }

  if (resultados) {
    return (
      <div className="rounded-3xl border border-naranja-400/40 bg-white p-4 dark:bg-tierra-800">
        <p className="font-display text-lg font-extrabold">✨ Tus 3 sugerencias</p>
        <p className="text-xs opacity-60">Generadas por {resultados.fuente === 'ia' ? 'nuestra IA 🤖' : 'el chef automático 👨‍🍳'}</p>
        <div className="mt-3 space-y-2">
          {resultados.opciones.map((o, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onElegir(o)}
              className="btn-tap w-full rounded-2xl border-2 border-tierra-700/12 p-3 text-left dark:border-crema-200/12"
            >
              <p className="font-extrabold">{o.emojis?.join(' ') || '🥟'} {o.nombre}</p>
              <p className="text-xs opacity-70">{o.descripcion}</p>
            </motion.button>
          ))}
        </div>
        <button onClick={() => { setResultados(null); setPaso(0); setResp({}); }} className="btn-tap mt-3 text-sm font-bold opacity-60">
          ↺ Responder de nuevo
        </button>
      </div>
    );
  }

  const q = PREGUNTAS[paso];
  return (
    <div className="rounded-3xl border border-naranja-400/40 bg-white p-4 dark:bg-tierra-800">
      <p className="text-xs font-extrabold uppercase tracking-wide text-naranja-600 dark:text-naranja-400">🤖 ¿No sabes qué elegir?</p>
      <motion.p key={paso} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="mt-1 font-display text-lg font-extrabold">
        {q.emoji} {q.titulo}
      </motion.p>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.opciones.map((o) => (
          <button key={o.l} onClick={() => responder(o.v)}
            className="btn-tap rounded-full border-2 border-tierra-700/12 px-3 py-2 text-sm font-bold dark:border-crema-200/12">
            {o.l}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-1">
        {PREGUNTAS.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= paso ? 'bg-naranja-500' : 'bg-crema-200 dark:bg-tierra-700'}`} />
        ))}
      </div>
    </div>
  );
}
