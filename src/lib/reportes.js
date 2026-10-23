// Motor de reportes: agrega pedidos en KPIs, cortes por día/producto/cliente/
// ingrediente/actividad y genera insights accionables. Lógica pura sin DOM —
// apta para tests con vite-node.
import { costoPedido, costoEmpanadaItem } from './costos';
import { consumoStockPedido } from './stock';

const capitalizar = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Rango de fechas de un período: tipo 'mes' (valor 'YYYY-MM') o 'anio' (YYYY).
export function periodoRango(tipo, valor) {
  if (tipo === 'anio') {
    const anio = Number(valor);
    return {
      tipo, valor,
      desde: `${anio}-01-01T00:00:00.000Z`,
      hasta: `${anio + 1}-01-01T00:00:00.000Z`,
      etiqueta: `Año ${anio}`,
      corto: String(anio),
    };
  }
  const [anio, mes] = String(valor).split('-').map(Number);
  const mes2 = String(mes).padStart(2, '0');
  const sig = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
  const nombre = new Date(Date.UTC(anio, mes - 1, 1))
    .toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return {
    tipo, valor,
    desde: `${anio}-${mes2}-01T00:00:00.000Z`,
    hasta: `${sig}T00:00:00.000Z`,
    etiqueta: capitalizar(nombre),
    corto: `${anio}-${mes2}`,
  };
}

export function periodoAnterior(p) {
  if (p.tipo === 'anio') return periodoRango('anio', String(Number(p.valor) - 1));
  const [a, m] = p.valor.split('-').map(Number);
  return m === 1
    ? periodoRango('mes', `${a - 1}-12`)
    : periodoRango('mes', `${a}-${String(m - 1).padStart(2, '0')}`);
}

// Lista de períodos disponibles para los selectores (hacia atrás desde hoy).
export function periodosDisponibles(tipo, ahora = new Date()) {
  const salida = [];
  if (tipo === 'anio') {
    for (let a = ahora.getFullYear(); a >= ahora.getFullYear() - 4; a--) {
      salida.push({ valor: String(a), etiqueta: `Año ${a}` });
    }
    return salida;
  }
  const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  for (let i = 0; i < 24; i++) {
    const d = new Date(fin.getFullYear(), fin.getMonth() - i, 1);
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    salida.push({
      valor,
      etiqueta: capitalizar(d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })),
    });
  }
  return salida;
}

// Nombre de la empanada: usa el nombre guardado o lo arma desde el catálogo.
function nombreEmpanada(it, porId = {}) {
  if (it.nombre) return it.nombre;
  const partes = [
    it.proteina || porId[it.proteinaId]?.nombre,
    it.queso || porId[it.quesoId]?.nombre,
    ...(it.acompanamientos || it.acompanamientosIds || []).map((id) => porId[id]?.nombre || id),
  ].filter(Boolean);
  return partes.join(' + ') || 'Empanada';
}

function acumular(mapa, clave, campos) {
  if (!mapa[clave]) mapa[clave] = { clave, veces: 0, empanadas: 0, unidades: 0, ventas: 0, costo: 0, ...campos };
  return mapa[clave];
}

// Reporte completo de un conjunto de pedidos dentro de un período.
export function construirReporte(pedidos = [], ctx = {}, periodo = null) {
  const { porId = {}, bebidas = [], settings = {} } = ctx;
  const porBebida = Array.isArray(bebidas)
    ? Object.fromEntries(bebidas.map((b) => [b.id, b]))
    : bebidas;

  const dentro = (p) => {
    if (!periodo) return true;
    const t = Date.parse(p.createdAt || '');
    return !Number.isNaN(t) && t >= Date.parse(periodo.desde) && t < Date.parse(periodo.hasta);
  };

  const todos = pedidos.filter(dentro);
  const pagados = todos.filter((p) => p.status !== 'pendiente_pago');

  // ---------- KPIs ----------
  const ventas = pagados.reduce((s, p) => s + (p.totales?.total || 0), 0);
  const costo = pagados.reduce((s, p) => s + costoPedido(p, ctx), 0);
  const margen = ventas - costo;
  let empanadasVendidas = 0;
  let bebidasVendidas = 0;
  pagados.forEach((p) => (p.items || []).forEach((it) => {
    if (it.tipo === 'bebida') bebidasVendidas += it.cantidad || 1;
    else empanadasVendidas += it.cantidad || 1;
  }));
  const deliveryTotal = pagados.reduce((s, p) => s + (p.totales?.delivery || 0), 0);
  const ahorroTotal = pagados.reduce((s, p) => s + (p.totales?.ahorro || 0), 0);
  const clientesUnicos = new Set(todos.map((p) => p.cliente?.telefono || p.cliente?.nombre).filter(Boolean));
  const diasActivos = new Set(pagados.map((p) => (p.createdAt || '').slice(0, 10))).size || 1;

  const kpis = {
    pedidos: todos.length,
    pagados: pagados.length,
    pendientes: todos.length - pagados.length,
    ventas,
    costo,
    margen,
    margenPct: ventas > 0 ? Math.round((margen / ventas) * 100) : 0,
    empanadasVendidas,
    bebidasVendidas,
    ticketPromedio: pagados.length > 0 ? Math.round(ventas / pagados.length) : 0,
    empanadasPorPedido: pagados.length > 0 ? Math.round((empanadasVendidas / pagados.length) * 10) / 10 : 0,
    deliveryTotal,
    ahorroTotal,
    clientesUnicos: clientesUnicos.size,
    ventasPorDia: Math.round(ventas / diasActivos),
    diasActivos,
  };

  // ---------- Corte diario ----------
  const mapaDia = {};
  pagados.forEach((p) => {
    const fecha = (p.createdAt || '').slice(0, 10);
    if (!fecha) return;
    const d = acumular(mapaDia, fecha, { fecha, empanadas: 0 });
    d.pedidos = (d.pedidos || 0) + 1;
    d.ventas += p.totales?.total || 0;
    d.costo += costoPedido(p, ctx);
    (p.items || []).forEach((it) => {
      if (it.tipo === 'bebida') d.bebidas = (d.bebidas || 0) + (it.cantidad || 1);
      else d.empanadas += it.cantidad || 1;
    });
  });
  const porDia = Object.values(mapaDia).sort((a, b) => a.fecha.localeCompare(b.fecha));
  porDia.forEach((d) => { d.margen = d.ventas - d.costo; });
  const mejorDia = porDia.reduce((m, d) => (!m || d.ventas > m.ventas ? d : m), null);

  // ---------- Productos (combinaciones) ----------
  const mapaProd = {};
  pagados.forEach((p) => (p.items || []).filter((it) => it.tipo !== 'bebida').forEach((it) => {
    const cant = it.cantidad || 1;
    const clave = it.clave || `${it.proteinaId || ''}|${it.quesoId || ''}|${(it.acompanamientosIds || []).join(',')}`;
    const reg = acumular(mapaProd, clave, {
      nombre: nombreEmpanada(it, porId),
      proteina: it.proteina || porId[it.proteinaId]?.nombre || '',
      queso: it.queso || porId[it.quesoId]?.nombre || '',
      acompanamientos: (it.acompanamientosIds || []).map((id) => porId[id]?.nombre || id),
      proteinaId: it.proteinaId, quesoId: it.quesoId, acompanamientosIds: it.acompanamientosIds || [],
    });
    reg.veces += 1;
    reg.empanadas += cant;
    reg.ventas += (it.precio || 0) * cant;
    reg.costo += costoEmpanadaItem(it, porId, settings) * cant;
  }));
  const porProducto = Object.values(mapaProd)
    .map((r) => ({ ...r, margen: r.ventas - r.costo, margenPct: r.ventas > 0 ? Math.round(((r.ventas - r.costo) / r.ventas) * 100) : 0 }))
    .sort((a, b) => b.empanadas - a.empanadas);

  // ---------- Ingredientes: uso, costo y merma/stock ----------
  const usoIng = {};
  const registrarUso = (id, veces) => {
    if (!id) return;
    if (!usoIng[id]) usoIng[id] = { id, veces: 0 };
    usoIng[id].veces += veces;
  };
  pagados.forEach((p) => (p.items || []).filter((it) => it.tipo !== 'bebida').forEach((it) => {
    const cant = it.cantidad || 1;
    const ex = it.extras || {};
    registrarUso(it.proteinaId, cant * (ex.proteina ? 2 : 1));
    registrarUso(it.quesoId, cant * (ex.queso ? 2 : 1));
    (it.acompanamientosIds || []).forEach((a) => registrarUso(a, cant));
    (ex.acomp || []).forEach((a) => registrarUso(a, cant));
  }));
  let masaGramosTotal = 0;
  pagados.forEach((p) => { masaGramosTotal += consumoStockPedido(p, { porId, settings }).masaGramos; });

  const ingredientes = Object.values(usoIng).map((u) => {
    const ing = porId[u.id] || { id: u.id, nombre: u.id };
    const costoPorcion = ((ing.porcionGramos || 0) * (ing.costoKg || 0)) / 1000;
    const rendimiento = typeof ing.stockGramos === 'number' && ing.porcionGramos
      ? Math.floor(ing.stockGramos / ing.porcionGramos) : null;
    return {
      id: u.id, nombre: ing.nombre, categoria: ing.categoria || '',
      vecesUsado: u.veces,
      consumoGramos: Math.round(u.veces * (ing.porcionGramos || 0)),
      costoTotal: Math.round(u.veces * costoPorcion),
      costoKg: ing.costoKg || 0, porcionGramos: ing.porcionGramos || 0,
      stockGramos: ing.stockGramos ?? null, rendimiento,
    };
  }).sort((a, b) => b.costoTotal - a.costoTotal);

  // ---------- Bebidas ----------
  const mapaBeb = {};
  pagados.forEach((p) => (p.items || []).filter((it) => it.tipo === 'bebida').forEach((it) => {
    const cant = it.cantidad || 1;
    const b = porBebida[it.id] || {};
    const reg = acumular(mapaBeb, it.id || it.nombre, { nombre: b.nombre || it.nombre });
    reg.unidades += cant;
    reg.ventas += (it.precio || b.precio || 0) * cant;
    reg.costo += (b.costo ?? it.costo ?? 0) * cant;
  }));
  const porBebidas = Object.values(mapaBeb)
    .map((r) => ({ ...r, margen: r.ventas - r.costo }))
    .sort((a, b) => b.unidades - a.unidades);

  // ---------- Clientes ----------
  const mapaCli = {};
  todos.forEach((p) => {
    const clave = p.cliente?.telefono || p.cliente?.nombre || '—';
    if (!mapaCli[clave]) {
      mapaCli[clave] = {
        nombre: p.cliente?.nombre || '—', telefono: p.cliente?.telefono || '',
        comuna: p.cliente?.comuna || '—', pedidos: 0, gastado: 0, ultima: '',
      };
    }
    const c = mapaCli[clave];
    c.pedidos += 1;
    if (p.status !== 'pendiente_pago') c.gastado += p.totales?.total || 0;
    const fecha = p.createdAt || '';
    if (fecha > c.ultima) c.ultima = fecha;
  });
  const porCliente = Object.values(mapaCli)
    .map((c) => ({ ...c, ticketProm: c.pedidos ? Math.round(c.gastado / c.pedidos) : 0 }))
    .sort((a, b) => b.gastado - a.gastado);

  // ---------- Actividad: comuna, día de semana, hora, estados ----------
  const mapaComuna = {};
  todos.forEach((p) => {
    const k = p.cliente?.comuna || '—';
    mapaComuna[k] = mapaComuna[k] || { comuna: k, pedidos: 0, gastado: 0 };
    mapaComuna[k].pedidos += 1;
    if (p.status !== 'pendiente_pago') mapaComuna[k].gastado += p.totales?.total || 0;
  });
  const porComuna = Object.values(mapaComuna).sort((a, b) => b.pedidos - a.pedidos);

  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const mapaDS = Object.fromEntries(DIAS.map((d) => [d, { dia: d, pedidos: 0, gastado: 0 }]));
  const mapaHora = Object.fromEntries(Array.from({ length: 24 }, (_, h) => [h, { hora: h, pedidos: 0 }]));
  pagados.forEach((p) => {
    const t = new Date(p.createdAt || '');
    if (Number.isNaN(t.getTime())) return;
    mapaDS[DIAS[t.getDay()]].pedidos += 1;
    mapaDS[DIAS[t.getDay()]].gastado += p.totales?.total || 0;
    mapaHora[t.getHours()].pedidos += 1;
  });
  const porDiaSemana = DIAS.map((d) => mapaDS[d]);
  const porHora = Object.values(mapaHora).map((h) => ({
    ...h, etiqueta: `${String(h.hora).padStart(2, '0')}:00`,
  }));

  const estados = {};
  todos.forEach((p) => { estados[p.status] = (estados[p.status] || 0) + 1; });

  // ---------- Ranking de ingredientes por frecuencia (proteína/queso/acomp) ----------
  const contarCat = (cat) => {
    const m = {};
    porProducto.forEach((pr) => {
      const ids = cat === 'proteina' ? [pr.proteinaId]
        : cat === 'queso' ? [pr.quesoId]
          : pr.acompanamientosIds;
      const factor = cat === 'acompanamiento' ? 1 : pr.empanadas;
      ids.filter(Boolean).forEach((id) => { m[id] = (m[id] || 0) + factor; });
    });
    return Object.entries(m)
      .map(([id, veces]) => ({ id, nombre: porId[id]?.nombre || id, veces, emoji: porId[id]?.emoji }))
      .sort((a, b) => b.veces - a.veces);
  };
  const topProteinas = contarCat('proteina');
  const topQuesos = contarCat('queso');
  const topAcompanamientos = contarCat('acompanamiento');

  const reporte = {
    periodo,
    generadoEn: new Date().toISOString(),
    kpis,
    porDia,
    mejorDia,
    porProducto,
    topProductos: porProducto.slice(0, 10),
    porBebidas,
    porCliente,
    topClientes: porCliente.slice(0, 10),
    porComuna,
    porDiaSemana,
    porHora,
    estados,
    ingredientes,
    masaGramosTotal,
    topProteinas,
    topQuesos,
    topAcompanamientos,
    ctx: { settings, masa: settings.masa || {} },
  };
  reporte.insights = generarInsights(reporte, ctx);
  return reporte;
}

// Delta porcentual entre dos valores (null si no hay base).
function crecimiento(actual, previo) {
  if (!previo) return null;
  return Math.round(((actual - previo) / previo) * 100);
}

// Insights automáticos: conclusiones y recomendaciones accionables.
export function generarInsights(r, _ctx = {}) {
  const out = [];
  const { kpis, porProducto, topClientes, porComuna, porHora, porDiaSemana, ingredientes, porBebidas, porDia } = r;
  const k = kpis;

  out.push({
    tipo: 'resumen', nivel: 'info',
    titulo: 'Resumen del período',
    texto: `${k.pedidos} pedidos (${k.pagados} pagados, ${k.pendientes} pendientes), `
      + `${k.empanadasVendidas} empanadas y ${k.bebidasVendidas} bebidas. `
      + `Ventas ${fmt(k.ventas)} con margen bruto ${fmt(k.margen)} (${k.margenPct}%). `
      + `Ticket promedio ${fmt(k.ticketPromedio)}.`,
  });

  if (k.pendientes > 0 && k.pendientes >= k.pagados * 0.3) {
    out.push({
      tipo: 'cobranza', nivel: 'alerta',
      titulo: 'Muchos pedidos sin pagar',
      texto: `${k.pendientes} pedidos están "Pendiente de pago". Contactar por WhatsApp a estos clientes `
        + 'reduce la fricción y evita que la producción quede reservada sin cobro.',
    });
  }

  if (k.margenPct > 0 && k.margenPct < 45) {
    out.push({
      tipo: 'margen', nivel: 'alerta',
      titulo: 'Margen global ajustado',
      texto: `El margen bruto es ${k.margenPct}%. Por cada $10.000 vendidos quedan ${fmt(k.margen)} de ganancia `
        + 'antes de delivery, mano de obra y gastos. Revisar precios de las combinaciones menos rentables (hoja Productos).',
    });
  } else if (k.margenPct >= 55) {
    out.push({
      tipo: 'margen', nivel: 'ok',
      titulo: 'Margen sano',
      texto: `El margen bruto es ${k.margenPct}%. Hay espacio para promociones puntuales sin comprometer la rentabilidad.`,
    });
  }

  if (porProducto.length > 0) {
    const top = porProducto.slice(0, 3);
    out.push({
      tipo: 'productos', nivel: 'info',
      titulo: 'Productos estrella',
      texto: `Los más vendidos: ${top.map((p) => `${p.nombre} (${p.empanadas}u)`).join(', ')}. `
        + 'Conviene asegurar stock de esos ingredientes y destacarlos en la tienda.',
    });
    const flojos = porProducto.filter((p) => p.empanadas <= 1 && porProducto.length >= 5);
    if (flojos.length >= 2) {
      out.push({
        tipo: 'productos', nivel: 'sugerencia',
        titulo: 'Baja rotación',
        texto: `${flojos.length} combinaciones vendieron 1 unidad o menos. Considerar quitarlas del armador `
          + 'o promocionarlas con descuento para no inmovilizar ingredientes.',
      });
    }
    const negativos = porProducto.filter((p) => p.margen < 0);
    if (negativos.length > 0) {
      out.push({
        tipo: 'precios', nivel: 'alerta',
        titulo: 'Combinaciones con pérdida',
        texto: `${negativos.map((p) => p.nombre).join('; ')} se venden por debajo de su costo de ingredientes. `
          + 'Subir precio, reducir porciones o eliminarlas ya.',
      });
    } else {
      const bajos = porProducto.filter((p) => p.margenPct < 30).sort((a, b) => a.margenPct - b.margenPct).slice(0, 3);
      if (bajos.length > 0) {
        out.push({
          tipo: 'precios', nivel: 'sugerencia',
          titulo: 'Revisar precios de estas combinaciones',
          texto: `Tienen margen bajo (<30%): ${bajos.map((p) => `${p.nombre} (${p.margenPct}%)`).join(', ')}. `
            + 'Un aumento de $200–$300 probablemente no afecta la venta y mejora la ganancia.',
        });
      }
    }
  }

  if (topClientes.length > 0) {
    const top3 = topClientes.slice(0, 3);
    const concentracion = k.ventas > 0 ? Math.round((top3.reduce((s, c) => s + c.gastado, 0) / k.ventas) * 100) : 0;
    out.push({
      tipo: 'clientes', nivel: 'info',
      titulo: 'Mejores clientes',
      texto: `${top3.map((c) => `${c.nombre} (${c.pedidos} pedidos, ${fmt(c.gastado)})`).join('; ')}. `
        + `Los 3 mejores concentran ${concentracion}% de las ventas.`,
    });
    if (concentracion >= 50 && k.clientesUnicos >= 5) {
      out.push({
        tipo: 'clientes', nivel: 'sugerencia',
        titulo: 'Dependencia de pocos clientes',
        texto: 'Más de la mitad de las ventas vienen de 3 personas. Un programa de fidelidad '
          + '(puntos por pedido, cupón por referido) protege el negocio de esa concentración.',
      });
    }
  }

  if (porComuna.length > 0) {
    const mejor = porComuna[0];
    out.push({
      tipo: 'zona', nivel: 'info',
      titulo: 'Zona con más pedidos',
      texto: `${mejor.comuna} lidera con ${mejor.pedidos} pedidos (${fmt(mejor.gastado)}). `
        + 'Ahí conviene concentrar folletos, avisos en grupos vecinales y franjas de reparto.',
    });
  }

  const horasTop = [...porHora].sort((a, b) => b.pedidos - a.pedidos).slice(0, 3).filter((h) => h.pedidos > 0);
  if (horasTop.length > 0) {
    out.push({
      tipo: 'operacion', nivel: 'info',
      titulo: 'Horas punta',
      texto: `Los pedidos se concentran en ${horasTop.map((h) => h.etiqueta).join(', ')}. `
        + 'Programar ahí la mayor capacidad de freidora y reparto evita cuellos de botella.',
    });
  }
  // Solo días con actividad, para no recomendar promo contra un día sin ventas.
  const conVentas = porDiaSemana.filter((d) => d.pedidos > 0);
  const diaFlojo = [...conVentas].sort((a, b) => a.pedidos - b.pedidos)[0];
  const diaFuerte = [...conVentas].sort((a, b) => b.pedidos - a.pedidos)[0];
  if (diaFlojo && diaFuerte && diaFlojo.dia !== diaFuerte.dia && diaFlojo.pedidos < diaFuerte.pedidos) {
    out.push({
      tipo: 'operacion', nivel: 'sugerencia',
      titulo: `Promo para ${diaFlojo.dia}`,
      texto: `${diaFuerte.dia} se vende mucho más (${diaFuerte.pedidos} pedidos) que ${diaFlojo.dia} (${diaFlojo.pedidos}). `
        + `Una oferta ese día (2x1, descuento o empanada de regalo) puede equilibrar la demanda y aprovechar la capacidad ociosa.`,
    });
  }

  const bebsTop = porBebidas.slice(0, 3).filter((b) => b.margen > 0);
  if (bebsTop.length > 0 && k.empanadasVendidas > 0) {
    const pctConBebida = Math.round((bebsTop.reduce((s, b) => s + b.unidades, 0) / k.empanadasVendidas) * 100);
    out.push({
      tipo: 'upsell', nivel: 'sugerencia',
      titulo: 'Potenciar bebidas',
      texto: `Solo ${pctConBebida}% de las empanadas vendidas se llevaron bebida, y tienen buen margen. `
        + 'Mostrar el pack "empanada + bebida" en el carrito y al final del armador aumenta el ticket sin más costo de cocina.',
    });
  }

  const stockCritico = ingredientes.filter((i) => i.rendimiento !== null && i.rendimiento <= 10)
    .sort((a, b) => a.rendimiento - b.rendimiento).slice(0, 5);
  if (stockCritico.length > 0) {
    out.push({
      tipo: 'stock', nivel: 'alerta',
      titulo: 'Reponer urgentemente',
      texto: `Con el stock actual solo alcanza para ~${stockCritico[0].rendimiento} empanadas de ${stockCritico[0].nombre}. `
        + `También: ${stockCritico.slice(1, 4).map((i) => `${i.nombre} (~${i.rendimiento})`).join(', ')}.`,
    });
  }

  const topCosto = ingredientes.slice(0, 3).filter((i) => i.costoTotal > 0);
  if (topCosto.length > 0) {
    out.push({
      tipo: 'costos', nivel: 'info',
      titulo: 'Mayores costos de materia prima',
      texto: `${topCosto.map((i) => `${i.nombre} ${fmt(i.costoTotal)}`).join(', ')}. `
        + 'Negociar precios por volumen o buscar segundo proveedor de estos ítems ataca directamente la ganancia.',
    });
  }

  if (porDia.length >= 7) {
    const mitad = Math.floor(porDia.length / 2);
    const p1 = porDia.slice(0, mitad).reduce((s, d) => s + d.ventas, 0);
    const p2 = porDia.slice(mitad).reduce((s, d) => s + d.ventas, 0);
    const varPct = crecimiento(p2, p1);
    if (varPct !== null) {
      out.push({
        tipo: 'tendencia', nivel: varPct >= 0 ? 'ok' : 'alerta',
        titulo: varPct >= 0 ? 'Tendencia al alza' : 'Tendencia a la baja',
        texto: `La segunda mitad del período vendió ${Math.abs(varPct)}% ${varPct >= 0 ? 'más' : 'menos'} que la primera `
          + `(${fmt(p2)} vs ${fmt(p1)}).`,
      });
    }
  }

  out.push({
    tipo: 'merma', nivel: 'sugerencia',
    titulo: 'Cómo bajar la merma',
    texto: 'Registrar en Inventario cada compra y cada baja real (empanada quemada, relleno sobrante). '
      + 'Con esos datos el consumo real se compara con el teórico de esta hoja y la diferencia es exactamente la merma. '
      + 'Meta inicial: menos del 5% del costo de materia prima.',
  });

  return out;
}

function fmt(n) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
  } catch { return `$${Math.round(n || 0).toLocaleString('es-CL')}`; }
}
