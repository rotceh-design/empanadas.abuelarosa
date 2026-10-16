import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseConfigured } from './firebase';

// Recomendación IA con fallback local si falla o no hay Firebase.
export async function recomendar({ vegetariana, favorito, picante }) {
  if (isFirebaseConfigured) {
    try {
      const fn = httpsCallable(functions, 'recomendar');
      const res = await fn({ vegetariana, favorito, picante });
      if (res.data?.opciones?.length) return res.data;
    } catch (e) {
      console.warn('IA no disponible:', e?.message);
    }
  }
  return { fuente: 'local', opciones: fallbackLocal({ vegetariana, favorito, picante }) };
}

function fallbackLocal({ vegetariana, favorito, picante }) {
  const P = vegetariana
    ? [{ id: 'p_seitan', nombre: 'Seitan', emoji: '🌾' }]
    : [
        { id: 'p_carne', nombre: 'Carne picada', emoji: '🥩' },
        { id: 'p_pollo', nombre: 'Pollo', emoji: '🍗' },
        { id: 'p_salmon', nombre: 'Salmón', emoji: '🐠' },
      ];
  const Q = vegetariana
    ? [{ id: 'q_vegano', nombre: 'Vegano', emoji: '🌱' }]
    : [
        { id: 'q_gouda', nombre: 'Gouda', emoji: '🧀' },
        { id: 'q_mozzarella', nombre: 'Mozzarella', emoji: '🧀' },
      ];
  const base = [
    { id: 'a_tomate', nombre: 'Tomate', emoji: '🍅' },
    { id: 'a_choclo', nombre: 'Choclo', emoji: '🌽' },
    { id: 'a_cebolla', nombre: 'Cebolla caramelizada', emoji: '🧅' },
    { id: 'a_espinaca', nombre: 'Espinaca', emoji: '🍃' },
    { id: 'a_champinon', nombre: 'Champiñón', emoji: '🍄' },
    { id: 'a_pimenton', nombre: 'Pimentón', emoji: '🫑' },
    { id: 'a_zapallo', nombre: 'Zapallo italiano', emoji: '🥒' },
    { id: 'a_albahaca', nombre: 'Albahaca', emoji: '🌿' },
  ];
  const picantes = ['a_pimenton'];
  const filtrados = picante === false ? base.filter((a) => !picantes.includes(a.id))
    : picante === true ? [...base.filter((a) => picantes.includes(a.id)), ...base.filter((a) => !picantes.includes(a.id))]
    : base;
  const fav = favorito?.toLowerCase();
  const ordenados = fav
    ? [...filtrados.filter((a) => a.nombre.toLowerCase().includes(fav)), ...filtrados.filter((a) => !a.nombre.toLowerCase().includes(fav))]
    : filtrados;

  const s = (favorito || '').length + (vegetariana ? 1 : 0);
  return [0, 1, 2].map((k) => {
    const a = [];
    for (let i = 0; i < 4; i++) a.push(ordenados[(s + k * 2 + i * 3) % ordenados.length]);
    const unicos = [...new Map(a.map((x) => [x.id, x])).values()];
    const p = P[(s + k) % P.length];
    const q = Q[(s + k) % Q.length];
    return {
      nombre: `${p.emoji} ${p.nombre} con ${q.nombre}`,
      proteinaId: p.id, quesoId: q.id,
      acompanamientosIds: unicos.map((x) => x.id),
      emojis: [p.emoji, q.emoji, ...unicos.map((x) => x.emoji)],
      descripcion: unicos.map((x) => x.nombre).join(', '),
    };
  });
}
