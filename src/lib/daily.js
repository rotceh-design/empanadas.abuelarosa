// Rotación de empanadas del día sobre el UNIVERSO COMPLETO de combinaciones
// (las mismas recetas que arma el cliente: proteína + queso + acompañamientos).
//
// Cinta lineal de N = S + D recetas (S saladas, D dulces), 3 por día.
// Las dulces se intercalan de forma pareja en toda la cinta (regla de
// Bresenham), de modo que AMBAS líneas recorren juntas el viaje completo
// (~ceil(N/3) días) en vez de agotar las dulces a los ~180 días.
// El orden dentro de cada línea es determinista por fecha: mismo día → mismas
// 3 recetas. No se repite ninguna receta hasta completar la vuelta entera.

import { precioEmpanada } from './precios';

function diasDesdeEpoch(fecha = new Date()) {
  return Math.floor(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) / 86400000);
}

// C(n, r) combinatoria simple (n pequeños).
function comb(n, r) {
  if (r < 0 || r > n) return 0;
  const k = Math.min(r, n - r);
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return Math.round(c);
}

// k-ésima combinación (orden lexicográfico) de r elementos de [0..n).
// Permite obtener la receta sin materializar las C(n,r) combinaciones.
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

// Universo disponible (proteínas/quesos/acoms filtrados por `disponible`).
function universo(lineas) {
  const salada = lineas?.find((l) => l.id === 'salada');
  const dulce = lineas?.find((l) => l.id === 'dulce');

  const P = (salada?.proteinas || []).filter((x) => x.disponible !== false);
  const Q = (salada?.quesos || []).filter((x) => x.disponible !== false);
  const A = (salada?.acompanamientos || []).filter((x) => x.disponible !== false);
  const cant = salada?.cantidadAcompanamientos || 4;
  const nAc = A.length >= cant ? comb(A.length, cant) : 0;
  const S = P.length * Q.length * nAc;

  const R = (dulce?.proteinas || []).filter((x) => x.disponible !== false);
  const Qd = (dulce?.quesos || []).filter((x) => x.disponible !== false);
  const E = (dulce?.acompanamientos || []).filter((x) => x.disponible !== false);
  const D = R.length * Qd.length * E.length;

  return { P, Q, A, cant, nAc, S, R, Qd, E, D, N: S + D };
}

// ¿El slot j de la cinta es una receta dulce? Reparte las D dulces de forma
// pareja entre los N slots (Bresenham): DulceCountAntes(j) = floor(j*D/N).
function slotDulce(j, D, N) {
  return Math.floor(((j + 1) * D) / N) > Math.floor((j * D) / N);
}

// Receta salada por su ordinal 0..S-1. La proteína es el dígito MÁS rápido
// (ordinal % P), para que días consecutivos alternen proteínas en vez de
// agruparse en bloques de ~440 días por proteína.
function saladaPorOrdinal(u, ordinal) {
  const P = u.P.length;
  const Q = u.Q.length;
  const proteinIdx = ordinal % P;
  const rest = Math.floor(ordinal / P);
  const quesoIdx = rest % Q;
  const acIdx = Math.floor(rest / Q);
  const acIdxs = kthCombinacion(acIdx, u.A.length, u.cant);
  return {
    linea: 'salada',
    proteina: u.P[proteinIdx],
    queso: u.Q[quesoIdx],
    acamps: acIdxs.map((i) => u.A[i]),
  };
}

// Receta dulce por su ordinal 0..D-1. El relleno también es el dígito más
// rápido, para alternar dulces entre sí.
function dulcePorOrdinal(u, ordinal) {
  const R = u.R.length;
  const Qd = u.Qd.length;
  return {
    linea: 'dulce',
    proteina: u.R[ordinal % R],
    queso: u.Qd[Math.floor(ordinal / R) % Qd],
    acamps: [u.E[Math.floor(ordinal / (R * Qd)) % u.E.length]],
  };
}

function armarCombinacion({ linea, proteina, queso, acamps }, settings, precioDia, indice) {
  const clave = ['dia', indice, proteina.id, queso.id, ...acamps.map((a) => a.id)].join('+');
  let precioRegular = 0;
  try {
    precioRegular = precioEmpanada(
      { proteina, queso, acompanamientos: acamps },
      settings, 0, 0, linea,
    );
  } catch { precioRegular = precioDia; }
  return {
    linea,
    nombre: 'Combo del Día',
    precio: precioDia,
    precioRegular,
    clave,
    proteinaId: proteina.id,
    quesoId: queso.id,
    acompanamientosIds: acamps.map((a) => a.id),
    proteina: proteina.nombre,
    queso: queso.nombre,
    acompanamientos: acamps.map((a) => a.nombre),
    emojis: [proteina.emoji, queso.emoji, ...acamps.map((a) => a.emoji)],
    colores: [proteina.color, queso.color, ...acamps.map((a) => a.color)],
  };
}

// Las 3 recetas del día, tomadas de 3 slots consecutivos de la cinta global.
// `fecha` permite generar cualquier día (calendarios); por defecto, hoy.
export function combinacionesDelDia({ lineas, settings, porId, fecha = new Date() }) {
  const cfg = settings?.combinacionDia;
  if (cfg?.activo === false) return [];
  const precioDia = cfg?.precio ?? 2990;
  const dia = diasDesdeEpoch(fecha);
  const u = universo(lineas);
  if (!u.N) return [];

  const resultado = [];
  for (let s = 0; s < 3; s++) {
    const j = (dia * 3 + s) % u.N;
    const esDulce = u.D > 0 && slotDulce(j, u.D, u.N);
    // Índice ordinal dentro de su línea (dulces contados aparte).
    const dulcesAntes = Math.floor((j * u.D) / u.N);
    const ordinal = esDulce ? dulcesAntes : j - dulcesAntes;
    const receta = esDulce ? dulcePorOrdinal(u, ordinal) : saladaPorOrdinal(u, ordinal);
    if (!receta.proteina || !receta.queso || !receta.acamps.length) continue;
    resultado.push(armarCombinacion(receta, settings, precioDia, `${dia}-${s}`));
  }

  // Override del admin: fuerza la primera receta del día.
  if (cfg?.forzada?.proteinaId && porId?.[cfg.forzada.proteinaId] && resultado.length) {
    const proteina = porId[cfg.forzada.proteinaId];
    const queso = porId[cfg.forzada.quesoId] || resultado[0].queso;
    const acamps = (cfg.forzada.acompanamientosIds || []).map((id) => porId?.[id]).filter(Boolean);
    if (proteina.disponible !== false && acamps.length) {
      resultado[0] = armarCombinacion({ linea: 'salada', proteina, queso, acamps }, settings, precioDia, `${dia}-forzada`);
    }
  }

  return resultado;
}

// Primera combinación del día (compatibilidad con usos que solo quieren una).
export function combinacionDelDia(args) {
  return combinacionesDelDia(args)[0] ?? null;
}

// Ítem de carrito listo para agregar la combinación del día a precio especial.
export function itemCombinacionDelDia(cfg, precioBase = 2990) {
  const extrasPrecio = cfg.precio - precioBase; // 0: se cobra a precio del día
  return {
    linea: cfg.linea || 'salada',
    nombre: `${cfg.nombre} — ${cfg.proteina}`,
    proteinaId: cfg.proteinaId,
    quesoId: cfg.quesoId,
    acompanamientosIds: cfg.acompanamientosIds,
    proteina: cfg.proteina,
    queso: cfg.queso,
    acompanamientos: cfg.acompanamientos,
    emojis: cfg.emojis,
    colores: cfg.colores,
    extras: { proteina: false, queso: false, acomp: [] },
    extrasCount: 0,
    extrasPrecio,
    etiquetas: [],
    precioUnitario: cfg.precio,
    clave: cfg.clave,
    esDelDia: true,
  };
}
