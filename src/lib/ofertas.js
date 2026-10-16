import { fmtCLP } from './formato';

// Motor de ofertas: aplica automáticamente la mejor combinación posible.
// Empanadas con extras: el extra siempre se cobra aparte, el bundle aplica al precio base.

export function calcularMejorOferta({ empanadas = [], bebidas = [], ofertas = [], precioBase = 0, precioBebida = 0 }) {
  // Del día: precio propio, jamás participa en bundles (ya trae su descuento).
  const normales = empanadas.filter((e) => !e.esDelDia);
  const delDia = empanadas.filter((e) => e.esDelDia);
  const nEmp = normales.reduce((s, e) => s + (e.cantidad || 1), 0);
  const nEmpDia = delDia.reduce((s, e) => s + (e.cantidad || 1), 0);
  const nBeb = bebidas.reduce((s, b) => s + (b.cantidad || 1), 0);
  const extrasTotales = empanadas.reduce((s, e) => s + (e.extrasPrecio || 0) * (e.cantidad || 1), 0);
  const precioDelDia = delDia.reduce((s, e) => s + (e.precioUnitario ?? precioBase) * (e.cantidad || 1), 0);
  // Promo del día: −$200 al total cuando el carrito tiene al menos 1 empanada
  // del día + 1 bebida. Se aplica UNA vez, encima de las ofertas existentes.
  const promoDelDia = (nBeb > 0 && nEmpDia > 0) ? 200 : 0;
  const detallePromo = 'Empanada del día + bebida −$200';

  const activas = ofertas.filter((o) => o.activa);
  if (activas.length === 0 || nEmp === 0) {
    const bruto = nEmp * precioBase + nBeb * precioBebida + extrasTotales + precioDelDia;
    return {
      total: Math.max(0, bruto - promoDelDia),
      ahorro: promoDelDia,
      usado: null,
      detalle: promoDelDia ? [detallePromo] : [],
    };
  }

  const maxEmp = Math.max(...activas.map((o) => o.empanadas), nEmp);
  const maxBeb = Math.max(...activas.map((o) => o.bebidas), nBeb);

  // dp[i][j] = menor precio para i empanadas y j bebidas
  const INF = Number.POSITIVE_INFINITY;
  const dp = Array.from({ length: maxEmp + 1 }, () => Array(maxBeb + 1).fill(INF));
  const from = Array.from({ length: maxEmp + 1 }, () => Array(maxBeb + 1).fill(null));
  dp[0][0] = 0;

  for (let i = 0; i <= maxEmp; i++) {
    for (let j = 0; j <= maxBeb; j++) {
      if (dp[i][j] === INF) continue;
      activas.forEach((o) => {
        const ni = i + o.empanadas;
        const nj = j + o.bebidas;
        if (ni <= maxEmp && nj <= maxBeb && dp[i][j] + o.precio < dp[ni][nj]) {
          dp[ni][nj] = dp[i][j] + o.precio;
          from[ni][nj] = { oferta: o, prev: [i, j] };
        }
      });
    }
  }

  let mejor = INF;
  let best = null;
  for (let i = 0; i <= maxEmp; i++) {
    for (let j = 0; j <= maxBeb; j++) {
      if (dp[i][j] === INF) continue;
      const empRestantes = Math.max(0, nEmp - i);
      const bebRestantes = Math.max(0, nBeb - j);
      const total = dp[i][j] + empRestantes * precioBase + bebRestantes * precioBebida;
      if (total < mejor) {
        mejor = total;
        best = { i, j, base: dp[i][j] };
      }
    }
  }

  // Reconstruir ofertas usadas
  const usadas = [];
  let [ci, cj] = [best.i, best.j];
  while (ci > 0 || cj > 0) {
    const f = from[ci][cj];
    if (!f) break;
    usadas.push(f.oferta);
    [ci, cj] = f.prev;
  }

  const sinOferta = nEmp * precioBase + nBeb * precioBebida;
  const total = Math.max(0, mejor + extrasTotales + precioDelDia - promoDelDia);

  return {
    total,
    ahorro: Math.max(0, sinOferta - mejor + promoDelDia),
    usado: usadas,
    detalle: [...usadas.map((o) => o.nombre), ...(promoDelDia ? [detallePromo] : [])],
    empanadasSinOferta: Math.max(0, nEmp - best.i),
    bebidasSinOferta: Math.max(0, nBeb - best.j),
  };
}

export function mensajeAhorro(ahorro) {
  if (ahorro <= 0) return '';
  return `Ahorras ${fmtCLP(ahorro)} con nuestras ofertas 🎉`;
}
