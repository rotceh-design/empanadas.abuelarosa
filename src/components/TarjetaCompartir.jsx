import { motion } from 'framer-motion';
import { fmtCLP } from '../lib/formato';

// Tarjeta de "Mi empanada" lista para compartir por WhatsApp/Instagram.
export default function TarjetaCompartir({ empanada, precio, onCompartir }) {
  if (!empanada) return null;
  const { nombre, emojis = [], proteina, queso, acompanamientos = [], etiquetas = [] } = empanada;

  return (
    <div className="rounded-3xl border border-tierra-700/10 bg-gradient-to-br from-naranja-400 to-naranja-600 p-5 text-white shadow-lift">
      <p className="text-xs font-extrabold uppercase tracking-widest opacity-80">Mi empanada</p>

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-1">
        <p className="text-3xl leading-none">{emojis.slice(0, 3).join(' ')}</p>
      </motion.div>

      <p className="mt-2 font-display text-2xl font-extrabold leading-tight">“{nombre}”</p>
      <p className="text-sm opacity-90">{[proteina, queso].filter(Boolean).join(' · ')}</p>
      {acompanamientos.length > 0 && <p className="text-sm opacity-90">{acompanamientos.join(', ')}</p>}

      {etiquetas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {etiquetas.map((e) => (
            <span key={e} className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold uppercase">{e}</span>
          ))}
        </div>
      )}

      {precio != null && <p className="mt-3 font-display text-3xl font-extrabold">{fmtCLP(precio)}</p>}
      <p className="text-xs opacity-80">Abuela Rosa · Maipú 🇨🇱</p>

      {onCompartir && (
        <button onClick={onCompartir} className="btn-tap mt-3 w-full rounded-2xl bg-white py-2.5 font-extrabold text-naranja-600">
          📤 Compartir mi empanada
        </button>
      )}
    </div>
  );
}

export function textoCompartir(empanada) {
  const l = [];
  l.push('🥟 ¡Acabo de crear mi empanada en Abuela Rosa!');
  l.push('');
  l.push(`✨ “${empanada.nombre}”`);
  if (empanada.proteina) l.push(`🥩 ${empanada.proteina}`);
  if (empanada.queso) l.push(`🧀 ${empanada.queso}`);
  if (empanada.acompanamientos?.length) l.push(`🥗 ${empanada.acompanamientos.join(', ')}`);
  l.push('');
  l.push('Tú también puedes armar la tuya 👇');
  return l.join('\n');
}

export async function compartirTexto(texto, titulo = 'Mi empanada') {
  if (navigator.share) {
    try {
      await navigator.share({ title: titulo, text: texto });
      return 'compartido';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado';
    }
  }
  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'error';
  }
}

export function linkWhatsAppTexto(texto, numero = '') {
  const num = (numero || '').replace(/[^0-9]/g, '');
  const t = encodeURIComponent(texto);
  return num ? `https://wa.me/${num}?text=${t}` : `https://wa.me/?text=${t}`;
}
