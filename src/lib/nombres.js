import { combinarClaves } from './formato';

// Nombre profesional y descriptivo: proteína + queso, sin apodos inventados.
// La receta completa ya se detalla en la ficha del pedido.
export function generarNombre({ proteina, queso }) {
  if (!proteina) return 'Empanada';
  if (!queso) return proteina.nombre;
  return `${proteina.nombre} con ${queso.nombre}`;
}

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

export function sugerenciasPara({ proteina, queso, reglas = [] }) {
  const out = [];
  reglas.forEach((r) => {
    if (r.baseTipo === 'proteina' && proteina && r.baseId === proteina.id) out.push(r);
    if (r.baseTipo === 'queso' && queso && r.baseId === queso.id) out.push(r);
  });
  return out;
}
