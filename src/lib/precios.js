export const PRECIO_MIN_DEFECTO = 3490;
export const PRECIO_MAX_DEFECTO = 3990;
export const PRECIO_BASE_DEFECTO = 2990;

const APORTE_DEFECTO = {
  proteina: 1100,
  queso: 890,
  acompanamiento: 375,
};

export function aporteIngrediente(ing) {
  if (!ing) return 0;
  if (typeof ing.precio === 'number' && ing.precio >= 0) return ing.precio;
  return APORTE_DEFECTO[ing.categoria] ?? 0;
}

export function rangoEmpanada(settings, lineaId = 'salada') {
  if (lineaId === 'dulce') {
    const d = settings?.lineas?.dulce;
    return {
      min: typeof d?.precioMinEmpanada === 'number' && d.precioMinEmpanada > 0 ? d.precioMinEmpanada : 2790,
      max: typeof d?.precioMaxEmpanada === 'number' && d.precioMaxEmpanada > 0 ? d.precioMaxEmpanada : 3390,
    };
  }
  const min = settings?.precios?.precioMinEmpanada;
  const max = settings?.precios?.precioMaxEmpanada;
  return {
    min: typeof min === 'number' && min > 0 ? min : PRECIO_MIN_DEFECTO,
    max: typeof max === 'number' && max > 0 ? max : PRECIO_MAX_DEFECTO,
  };
}

function menorAporte() {
  return APORTE_DEFECTO.acompanamiento;
}

// Precio de la empanada dentro del rango [mín, tope] sumando los aportes de
// cada ingrediente elegido. `faltantes` estima acompañamientos aún no elegidos
// con el aporte más barato, y `extrasAdd` son los extras (proteína/queso/acomp).
export function precioEmpanada(seleccion, settings, extrasAdd = 0, faltantes = 0, lineaId = 'salada') {
  const { min, max } = rangoEmpanada(settings, lineaId);
  const aportes =
    aporteIngrediente(seleccion?.proteina) +
    aporteIngrediente(seleccion?.queso) +
    (seleccion?.acompanamientos || []).reduce((s, a) => s + aporteIngrediente(a), 0) +
    Math.max(0, faltantes) * menorAporte() +
    (extrasAdd || 0);
  return Math.min(Math.max(aportes, min), max);
}

export function extrasAgregados(extras, settings) {
  const p = settings?.precios || {};
  let suma = 0;
  if (extras?.proteina) suma += p.proteinaExtra ?? 900;
  if (extras?.queso) suma += p.quesoExtra ?? 700;
  suma += (extras?.acompanamientos?.length || 0) * (p.acompanamientoExtra ?? 400);
  return suma;
}

// Desglose línea por línea del precio de una empanada, para mostrarle al
// cliente de dónde sale el total. `ingredientes + extras + reservaFaltantes`
// suman `bruto`, y `total` es ese bruto ya ajustado al rango [mín, máx]: el
// ajuste queda explícito para que la suma siempre cierre con el precio final.
export function desgloseEmpanada(seleccion, settings, extras = {}, faltantes = 0, lineaId = 'salada') {
  const { min, max } = rangoEmpanada(settings, lineaId);
  const esDulce = lineaId === 'dulce';

  const filaIngrediente = (tipo, ing) => ({
    tipo,
    id: ing.id,
    nombre: ing.nombre,
    emoji: ing.emoji || '✨',
    aporte: aporteIngrediente(ing),
  });

  const ingredientes = [];
  if (seleccion?.proteina) ingredientes.push(filaIngrediente(esDulce ? 'relleno' : 'proteina', seleccion.proteina));
  if (seleccion?.queso) ingredientes.push(filaIngrediente('queso', seleccion.queso));
  (seleccion?.acompanamientos || []).forEach((a) => {
    if (a) ingredientes.push(filaIngrediente(esDulce ? 'extra' : 'acompanamiento', a));
  });

  const p = settings?.precios || {};
  const extrasLineas = esDulce
    ? []
    : [
        extras?.proteina && { tipo: 'extra', nombre: 'Proteína extra', aporte: p.proteinaExtra ?? 900 },
        extras?.queso && { tipo: 'extra', nombre: 'Queso extra', aporte: p.quesoExtra ?? 700 },
        ...(extras?.acompanamientos || []).map(() => ({
          tipo: 'extra', nombre: 'Acompañamiento extra', aporte: p.acompanamientoExtra ?? 400,
        })),
      ].filter(Boolean);

  const subtotalIngredientes = ingredientes.reduce((s, l) => s + l.aporte, 0);
  const extrasTotal = extrasLineas.reduce((s, l) => s + l.aporte, 0);
  const reservaFaltantes = Math.max(0, faltantes) * menorAporte();
  const bruto = subtotalIngredientes + extrasTotal + reservaFaltantes;
  const total = Math.min(Math.max(bruto, min), max);
  const ajuste = total - bruto;

  return {
    ingredientes,
    extras: extrasLineas,
    subtotalIngredientes,
    extrasTotal,
    reservaFaltantes,
    bruto,
    min,
    max,
    ajuste,
    ajusteTipo: ajuste === 0 ? null : (ajuste > 0 ? 'minimo' : 'maximo'),
    total,
  };
}

export function ajusteOferta(precioUnitario, settings) {
  const base = settings?.precios?.empanadaBase ?? PRECIO_BASE_DEFECTO;
  return (precioUnitario ?? base) - base;
}

// Desglose de una empanada ya agregada al carrito: reconstruye la receta desde
// los ids guardados y siempre cierra con el precio realmente cobrado
// (incluye precio del día y descuentos de oferta).
export function desgloseDeItem(item, { porId = {}, settings } = {}) {
  const seleccion = {
    proteina: item?.proteinaId ? porId[item.proteinaId] || null : null,
    queso: item?.quesoId ? porId[item.quesoId] || null : null,
    acompanamientos: (item?.acompanamientosIds || []).map((id) => porId[id]).filter(Boolean),
  };
  const extras = {
    proteina: !!item?.extras?.proteina,
    queso: !!item?.extras?.queso,
    acompanamientos: item?.extras?.acomp || item?.extras?.acompanamientos || [],
  };
  const base = desgloseEmpanada(seleccion, settings, extras, 0, item?.linea || 'salada');
  const cobrado = item?.precioUnitario ?? base.total;
  const ajuste = cobrado - base.bruto;

  return {
    ...base,
    ajuste,
    ajusteTipo: ajuste === 0 ? null : (ajuste > 0 ? 'minimo' : 'maximo'),
    etiquetaAjuste: item?.esDelDia ? 'Precio del día' : null,
    total: cobrado,
    conDetalles: base.ingredientes.length > 0,
  };
}
