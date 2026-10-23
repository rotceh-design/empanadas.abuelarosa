// Lógica pura de inventario: rendimiento en empanadas, alertas y consumo por pedido.
// Sin dependencias de backend ni DOM — apta para tests con vite-node.

export const UMBRAL_DEFECTO = 10;

// Cuántas empanadas se pueden hacer con el stock de un ingrediente.
// null = sin cargar (no genera alerta).
export function rendimientoEmpanadas({ stockGramos, porcionGramos } = {}) {
  if (typeof stockGramos !== 'number') return null;
  return Math.floor(stockGramos / (porcionGramos || 1));
}

export function rendimientoBebidas(stockUnidades) {
  return typeof stockUnidades === 'number' ? stockUnidades : null;
}

// Ingredientes/bebidas que quedaron en o bajo el umbral (defecto: 10 empanadas).
export function alertasStock({ ingredientes = [], bebidas = [], settings = {} } = {}) {
  const umbral = settings?.inventario?.umbralEmpanadas ?? UMBRAL_DEFECTO;
  const lista = [];
  ingredientes.forEach((ing) => {
    const r = rendimientoEmpanadas(ing);
    if (r !== null && r <= umbral) {
      lista.push({ tipo: 'ingrediente', id: ing.id, nombre: ing.nombre, emoji: ing.emoji, foto: ing.foto, rendimiento: r, umbral });
    }
  });
  bebidas.forEach((b) => {
    const r = rendimientoBebidas(b.stockUnidades);
    if (r !== null && r <= umbral) {
      lista.push({ tipo: 'bebida', id: b.id, nombre: b.nombre, emoji: b.emoji, foto: b.foto, rendimiento: r, umbral, unidades: true });
    }
  });
  const masaGramos = settings?.inventario?.masaGramos;
  if (typeof masaGramos === 'number') {
    const porcion = settings?.masa?.porcionGramos || 90;
    const r = Math.floor(masaGramos / porcion);
    if (r <= umbral) {
      lista.push({ tipo: 'masa', id: 'masa', nombre: settings?.masa?.nombre || 'Masa', emoji: '🫓', rendimiento: r, umbral });
    }
  }
  return lista.sort((a, b) => a.rendimiento - b.rendimiento);
}

// Cuánto stock consume (o devuelve) un pedido, en gramos por ingrediente,
// unidades por bebida y gramos de masa.
export function consumoStockPedido(pedido, { porId = {}, settings = {} } = {}) {
  const ings = {};
  const bebs = {};
  let masaGramos = 0;
  const sumarIng = (id, gramos) => {
    if (!id || !gramos) return;
    ings[id] = (ings[id] || 0) + gramos;
  };
  (pedido?.items || []).forEach((it) => {
    const cant = it.cantidad || 1;
    if (it.tipo === 'bebida') {
      if (it.id) bebs[it.id] = (bebs[it.id] || 0) + cant;
      return;
    }
    masaGramos += (settings?.masa?.porcionGramos || 90) * cant;
    const porcion = (id) => porId[id]?.porcionGramos || 0;
    sumarIng(it.proteinaId, porcion(it.proteinaId) * cant);
    sumarIng(it.quesoId, porcion(it.quesoId) * cant);
    (it.acompanamientosIds || []).forEach((a) => sumarIng(a, porcion(a) * cant));
    const ex = it.extras || {};
    if (ex.proteina) sumarIng(it.proteinaId, porcion(it.proteinaId) * cant);
    if (ex.queso) sumarIng(it.quesoId, porcion(it.quesoId) * cant);
    (ex.acomp || []).forEach((a) => sumarIng(a, porcion(a) * cant));
  });
  return { ings, bebs, masaGramos };
}

// +1 = consumir stock (pedido pasa a pagado), -1 = devolver (vuelve a pendiente),
// 0 = nada que ajustar.
export function signoStock(pedido, nuevoStatus) {
  const eraPendiente = pedido?.status === 'pendiente_pago';
  const ahoraPendiente = nuevoStatus === 'pendiente_pago';
  const yaDescuento = pedido?.stockDescontado === true;
  if (!eraPendiente && ahoraPendiente && yaDescuento) return -1;
  if (eraPendiente && !ahoraPendiente && !yaDescuento) return 1;
  return 0;
}
