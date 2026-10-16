import { combinarClaves } from './formato';

// Nombres graciosos generados con reglas editables.
const REGLAS = [
  { id: 'mar_y_tierra', test: (c) => c.proteinas.has('p_camaron') && (c.proteinas.has('p_carne') || c.proteinas.has('p_pollo')), nombre: 'La Mar y Tierra' },
  { id: 'verde_poderoso', test: (c) => c.vegana, nombre: 'El Verde Poderoso' },
  { id: 'realeza', test: (c) => c.proteinas.has('p_reineta'), nombre: 'La Reina Reineta' },
  { id: 'camaronero', test: (c) => c.proteinas.has('p_camaron'), nombre: 'El Camaronero' },
  { id: 'seitan_power', test: (c) => c.proteinas.has('p_seitan'), nombre: 'Seitan Power' },
  { id: 'salmón_real', test: (c) => c.proteinas.has('p_salmon'), nombre: 'El Salmón Real' },
  { id: 'fiestera', test: (c) => c.acomps.has('a_choclo') && c.acomps.has('a_pimenton'), nombre: 'La Fiestera' },
  { id: 'dulce_cebolla', test: (c) => c.acomps.has('a_cebolla'), nombre: 'La Cebolla Seductora' },
  { id: 'hongos', test: (c) => c.acomps.has('a_champinon') && c.acomps.has('a_espinaca'), nombre: 'La Bosque Encantado' },
  { id: 'quesera', test: (c) => c.quesos.has('q_llanero'), nombre: 'La Llanera Viajera' },
  // Línea dulce
  { id: 'd_nutella', test: (c) => c.proteinas.has('d_nutella'), nombre: 'La Bomba de Nutella' },
  { id: 'd_chocolate', test: (c) => c.proteinas.has('d_chocolate'), nombre: 'La Cacao' },
  { id: 'd_manjar', test: (c) => c.proteinas.has('d_manjar'), nombre: 'La Dulce Tentación' },
  { id: 'd_membrillo', test: (c) => c.proteinas.has('d_membrillo'), nombre: 'La Roja del Campo' },
  { id: 'clasica', test: () => true, nombre: 'La Clásica de la Casa' },
];

const SUFIJOS = ['', ' v2', ' XL', ' de la Abuela', ' Express', ' Premium'];

export function claveCombinacion({ proteina, queso, acompanamientos = [] }) {
  return combinarClaves(
    proteina?.id,
    queso?.id,
    ...acompanamientos.map((a) => a?.id)
  );
}

export function totalCombinaciones(linea) {
  const p = linea.proteinas?.length || 1;
  const q = linea.quesos?.length || 1;
  const a = linea.acompanamientos?.length || 0;
  const n = linea.cantidadAcompanamientos || 4;
  if (a < n) return 0;
  let permutaciones = 1;
  for (let i = 0; i < n; i++) permutaciones *= a - i;
  let divisor = 1;
  for (let i = 2; i <= n; i++) divisor *= i;
  return p * q * Math.floor(permutaciones / divisor);
}

export function generarNombre({ proteina, queso, acompanamientos = [], vegana = false }) {
  const contexto = {
    proteinas: new Set(proteina ? [proteina.id] : []),
    quesos: new Set(queso ? [queso.id] : []),
    acomps: new Set((acompanamientos || []).map((a) => a?.id)),
    vegana,
  };
  const regla = REGLAS.find((r) => r.test(contexto)) || REGLAS[REGLAS.length - 1];
  const sufijo = SUFIJOS[Math.floor(Math.random() * SUFIJOS.length)];
  return regla.nombre + sufijo;
}

export function sugerenciasPara({ proteina, queso, reglas = [] }) {
  const out = [];
  reglas.forEach((r) => {
    if (r.baseTipo === 'proteina' && proteina && r.baseId === proteina.id) out.push(r);
    if (r.baseTipo === 'queso' && queso && r.baseId === queso.id) out.push(r);
  });
  return out;
}
