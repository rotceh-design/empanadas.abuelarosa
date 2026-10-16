// Vuelca tmp_calendario.json: la rotación completa de empanadas del día.
// Reutiliza src/lib/daily.js (misma fuente que la app) para que el Excel
// muestre exactamente lo que verá el cliente cada día.
//
// Uso:  npx vite-node scripts/dump_calendario.mjs [AAAA-MM-DD]
//       (sin argumento: parte desde hoy; con argumento: parte desde esa fecha)
import { writeFileSync } from 'fs';
import { CATALOGO_SEED, SETTINGS_SEED } from '../src/data/catalogoSeed.js';
import { combinacionesDelDia } from '../src/lib/daily.js';

const ordenar = (l, c = 'orden') => [...l].sort((a, b) => (a[c] || 0) - (b[c] || 0));
const porLinea = (linea) => {
  const ings = CATALOGO_SEED.filter((i) => i.linea === linea && i.disponible !== false);
  return {
    proteinas: ordenar(ings.filter((i) => i.categoria === 'proteina')),
    quesos: ordenar(ings.filter((i) => i.categoria === 'queso')),
    acompanamientos: ordenar(ings.filter((i) => i.categoria === 'acompanamiento')),
  };
};
const salada = porLinea('salada');
const dulce = porLinea('dulce');
const lineas = [
  { id: 'salada', nombre: 'Salada', ...salada, cantidadAcompanamientos: 4 },
  { id: 'dulce', nombre: 'Dulce', ...dulce, quesos: salada.quesos, cantidadAcompanamientos: 1 },
];

function comb(n, r) {
  if (r < 0 || r > n) return 0;
  const k = Math.min(r, n - r);
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return Math.round(c);
}

const S = salada.proteinas.length * salada.quesos.length * comb(salada.acompanamientos.length, 4);
const D = dulce.proteinas.length * salada.quesos.length * dulce.acompanamientos.length;
const N = S + D;
const T = Math.ceil(N / 3);

const arg = process.argv[2];
const inicio = arg ? new Date(`${arg}T00:00:00`) : new Date();
inicio.setHours(0, 0, 0, 0);

const f2 = (n) => String(n).padStart(2, '0');
const fechaISO = (d) => `${d.getFullYear()}-${f2(d.getMonth() + 1)}-${f2(d.getDate())}`;
const fechaLarga = (d) =>
  `${d.getDate()} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()]} de ${d.getFullYear()}`;

const porId = Object.fromEntries(CATALOGO_SEED.map((i) => [i.id, i]));
const filas = [];
let dulces = 0;
let diasConDulce = 0;
const proteinasVistas = new Set();
const recetasVistas = new Set();

for (let d = 0; d < T; d++) {
  const fecha = new Date(inicio);
  fecha.setDate(fecha.getDate() + d);
  const combos = combinacionesDelDia({ lineas, settings: SETTINGS_SEED, porId, fecha });
  if (combos.some((c) => c.linea === 'dulce')) diasConDulce++;
  combos.forEach((c, s) => {
    if (c.linea === 'dulce') dulces++;
    if (c.linea === 'salada') proteinasVistas.add(c.proteina);
    recetasVistas.add(`${c.proteina}|${c.queso}|${c.acompanamientos.join(',')}`);
    filas.push({
      fecha: fechaISO(fecha),
      dia: d + 1,
      slot: s + 1,
      linea: c.linea === 'dulce' ? 'Dulce' : 'Salada',
      proteina: c.proteina,
      queso: c.queso,
      acompanamientos: c.acompanamientos.join(' · '),
      precioDia: c.precio,
      precioNormal: c.precioRegular,
    });
  });
}

const fin = new Date(inicio);
fin.setDate(fin.getDate() + (T - 1));

const salida = {
  inicio: fechaISO(inicio),
  inicioLargo: fechaLarga(inicio),
  fin: fechaISO(fin),
  finLargo: fechaLarga(fin),
  resumen: {
    recetasTotales: N,
    saladas: S,
    dulcesTotal: D,
    diasCiclo: T,
    filas: filas.length,
    recetasUnicas: recetasVistas.size,
    dulcesMostradas: dulces,
    diasConDulce,
    anos: +(T / 365.25).toFixed(1),
  },
  filas,
};

writeFileSync('tmp_calendario.json', JSON.stringify(salida));
console.log(
  `Calendario: ${fechaISO(inicio)} → ${fechaISO(fin)} | ${T} días | ${N} recetas ` +
  `(${S} saladas + ${D} dulces) | ${filas.length} filas | ${recetasVistas.size} únicas`,
);
