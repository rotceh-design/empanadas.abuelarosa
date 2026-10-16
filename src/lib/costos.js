// Costos y margen: todo en CLP, a partir de costoKg + porcionGramos del catálogo.
// Lógica pura — apta para tests con vite-node.

// Costo de una porción de ingrediente (g × $/kg ÷ 1000).
export function costoPorcion(ing) {
  if (!ing) return 0;
  return Math.round(((ing.porcionGramos || 0) * (ing.costoKg || 0)) / 1000);
}

export function costoMasa(settings) {
  const m = settings?.masa;
  if (!m) return 0;
  return Math.round(((m.porcionGramos || 0) * (m.costoKg || 0)) / 1000);
}

// Costo de 1 empanada: masa + proteína + queso + acompañamientos + extras.
export function costoEmpanadaItem(item, porId = {}, settings = {}) {
  let total = costoMasa(settings);
  const add = (id) => { total += costoPorcion(porId[id]); };
  add(item?.proteinaId);
  add(item?.quesoId);
  (item?.acompanamientosIds || []).forEach(add);
  const ex = item?.extras || {};
  if (ex.proteina) add(item?.proteinaId);
  if (ex.queso) add(item?.quesoId);
  (ex.acomp || []).forEach(add);
  return total;
}

// Costo de un item del carrito/pedido (ya multiplicado por cantidad).
export function costoItemPedido(item, { porId = {}, porBebida = {}, settings = {} } = {}) {
  const cant = item?.cantidad || 1;
  if (item?.tipo === 'bebida') {
    const bebida = porBebida[item.id];
    return (bebida?.costo ?? item.costo ?? 0) * cant;
  }
  return costoEmpanadaItem(item, porId, settings) * cant;
}

export function costoPedido(pedido, ctx = {}) {
  return Math.round((pedido?.items || []).reduce((s, it) => s + costoItemPedido(it, ctx), 0));
}

// Margen bruto = lo cobrado − costo de ingredientes (incluye delivery si lo hay).
export function margenPedido(pedido, ctx = {}) {
  return Math.round((pedido?.totales?.total || 0) - costoPedido(pedido, ctx));
}
