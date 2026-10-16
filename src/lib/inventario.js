// Persistencia de inventario dual: Supabase cuando está configurado,
// localStorage (overlay sobre los seeds) cuando corre en modo demo/local.
import { supabase, isSupabaseConfigured } from './supabase';
import { consumoStockPedido } from './stock';

const KEY = 'empanadas_admin_local';
const KEY_LOG = 'empanadas_inventario_log';

const oyentes = new Set();

function leerOverlay() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function leerOverlayInicial() {
  return leerOverlay();
}

function escribirOverlay(cambio) {
  const actual = leerOverlay();
  const nuevo = { ...actual, ...cambio };
  try { localStorage.setItem(KEY, JSON.stringify(nuevo)); } catch { /* noop */ }
  oyentes.forEach((cb) => { try { cb(nuevo); } catch { /* noop */ } });
  return nuevo;
}

export function suscribirOverlay(cb) {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

// Fusiona semilla + ediciones locales (parciales) + bajas.
// base: { ingredientes, bebidas, settings, ofertas?, reglas? }
export function aplicarOverlay(base, ov) {
  const overlay = ov || leerOverlay();
  const mergeLista = (seed = [], mapa = {}, elim = []) => {
    const vivos = seed
      .filter((i) => !elim.includes(i.id))
      .map((i) => (mapa[i.id] ? { ...i, ...mapa[i.id] } : i));
    const nuevos = Object.entries(mapa)
      .filter(([id]) => !seed.some((s) => s.id === id))
      .map(([id, datos]) => ({ id, ...datos }));
    return [...vivos, ...nuevos];
  };
  const res = {
    ingredientes: mergeLista(base.ingredientes, overlay.ingredientes, overlay.eliminados?.ingredients || []),
    bebidas: mergeLista(base.bebidas, overlay.bebidas, overlay.eliminados?.drinks || []),
    settings: fusionar(base.settings, overlay.settings),
  };
  if (base.ofertas) res.ofertas = mergeLista(base.ofertas, overlay.offers, overlay.eliminados?.offers || []);
  if (base.reglas) res.reglas = mergeLista(base.reglas, overlay.rules, overlay.eliminados?.rules || []);
  return res;
}

function parcheOverlay(campo, id, datos) {
  const actual = leerOverlay();
  escribirOverlay({ [campo]: { ...(actual[campo] || {}), [id]: datos } });
}

// Cada colección tiene su propio espacio dentro del overlay local.
function campoDe(coleccion) {
  if (coleccion === 'drinks') return 'bebidas';
  if (coleccion === 'ingredients') return 'ingredientes';
  return coleccion; // 'offers', 'rules', 'badges', …
}

// Alta/edición de documentos de catálogo ('ingredients' | 'drinks' | 'offers' | …).
export async function guardarDoc(coleccion, id, datos) {
  if (isSupabaseConfigured) {
    const fila = prepararFila(coleccion, datos);
    const { error } = await supabase.from(coleccion).upsert({ id, ...fila }, { onConflict: 'id' });
    if (error) throw error;
    return;
  }
  const campo = campoDe(coleccion);
  parcheOverlay(campo, id, datos);
  const actual = leerOverlay();
  if (actual.eliminados?.[coleccion]?.includes(id)) {
    escribirOverlay({
      eliminados: { ...actual.eliminados, [coleccion]: actual.eliminados[coleccion].filter((x) => x !== id) },
    });
  }
}

export async function eliminarDoc(coleccion, id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from(coleccion).delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const campo = campoDe(coleccion);
  const actual = leerOverlay();
  const mapa = { ...(actual[campo] || {}) };
  delete mapa[id];
  const elim = { ...(actual.eliminados || {}) };
  elim[coleccion] = [...new Set([...(elim[coleccion] || []), id])];
  escribirOverlay({ [campo]: mapa, eliminados: elim });
}

// Convierte la forma camelCase de la app a las columnas snake_case de Postgres.
function prepararFila(coleccion, datos) {
  const copia = { ...datos };
  if (coleccion === 'ingredients') {
    if ('porcionGramos' in copia) { copia.porcion_gramos = copia.porcionGramos; delete copia.porcionGramos; }
    if ('costoKg' in copia) { copia.costo_kg = copia.costoKg; delete copia.costoKg; }
    if ('stockGramos' in copia) { copia.stock_gramos = copia.stockGramos; delete copia.stockGramos; }
  }
  if (coleccion === 'drinks') {
    if ('stockUnidades' in copia) { copia.stock_unidades = copia.stockUnidades; delete copia.stockUnidades; }
  }
  // Limpia undefined (Supabase los rechaza).
  Object.keys(copia).forEach((k) => { if (copia[k] === undefined) delete copia[k]; });
  return copia;
}

// Merge profundo de maps: un patch parcial { inventario: { umbral } } no pisa
// el resto de `inventario`. Un patch parcial no pisa el resto del objeto.
function fusionar(base, patch) {
  if (patch === undefined) return base;
  if (base === undefined || base === null) return patch;
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  if (typeof base !== 'object' || Array.isArray(base)) return patch;
  const salida = { ...base };
  Object.entries(patch).forEach(([k, v]) => { salida[k] = fusionar(base[k], v); });
  return salida;
}

// Patch de settings (p. ej. { inventario: { umbralEmpanadas: 10 } }).
export async function guardarSettingsPatch(parcial) {
  if (isSupabaseConfigured) {
    // settings vive en una sola fila (id='main') dentro del jsonb `data`.
    const { data: row } = await supabase.from('settings').select('data').eq('id', 'main').maybeSingle();
    const base = row?.data || {};
    const nuevo = fusionar(base, parcial);
    const { error } = await supabase.from('settings')
      .upsert({ id: 'main', data: nuevo, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
    return;
  }
  const actual = leerOverlay();
  escribirOverlay({ settings: fusionar(actual.settings || {}, parcial) });
}

// Aplica consumo (signo +1) o devolución (signo -1) de stock según el pedido.
// Solo toca items con stock cargado (numérico); el resto se ignora.
export async function aplicarStock(pedido, signo, { porId = {}, bebidas = [], settings = {} } = {}) {
  if (!signo) return false;
  const consumo = consumoStockPedido(pedido, { porId, settings });

  // Deltas con signo: la RPC hace `stock - delta` (consume > 0, devuelve < 0).
  const deltasIng = {};
  Object.entries(consumo.ings).forEach(([id, gramos]) => {
    const ing = porId[id];
    if (!ing || typeof ing.stockGramos !== 'number') return;
    deltasIng[id] = Math.round(signo * gramos);
  });

  const deltasBeb = {};
  Object.entries(consumo.bebs).forEach(([id, unidades]) => {
    const b = bebidas.find((x) => x.id === id);
    if (!b || typeof b.stockUnidades !== 'number') return;
    deltasBeb[id] = signo * unidades;
  });

  const invActual = settings.inventario || {};
  const hayMasa = typeof invActual.masaGramos === 'number' && consumo.masaGramos > 0;
  const masaDelta = hayMasa ? signo * consumo.masaGramos : 0;

  if (isSupabaseConfigured) {
    // La RPC apply_stock hace el descuento/devolución de forma atómica en el servidor.
    const { error } = await supabase.rpc('apply_stock', {
      p_payload: {
        ings: deltasIng,
        bebs: deltasBeb,
        masa_gramos: masaDelta,
      },
    });
    if (error) throw error;
    return true;
  }

  // Modo local: aplicamos los deltas sobre el overlay.
  Object.entries(deltasIng).forEach(([id, delta]) => {
    const ing = porId[id];
    parcheOverlay('ingredientes', id, { stockGramos: Math.max(0, Math.round(ing.stockGramos - delta)) });
  });
  Object.entries(deltasBeb).forEach(([id, delta]) => {
    const b = bebidas.find((x) => x.id === id);
    parcheOverlay('bebidas', id, { stockUnidades: Math.max(0, b.stockUnidades - delta) });
  });
  if (hayMasa) {
    const masaGramos = Math.max(0, invActual.masaGramos - masaDelta);
    guardarSettingsPatch({ inventario: { ...invActual, masaGramos } });
  }
  return true;
}

// Historial de movimientos (compras y conteos).
export async function registrarMovimiento(entrada) {
  const data = Object.fromEntries(
    Object.entries({ ...entrada, fecha: new Date().toISOString() }).filter(([, v]) => v !== undefined),
  );
  if (isSupabaseConfigured) {
    try { await supabase.from('inventory_log').insert({ entrada: data, fecha: data.fecha }); } catch (e) { console.warn('No se registró el movimiento:', e); }
    return;
  }
  try {
    const lista = JSON.parse(localStorage.getItem(KEY_LOG) || '[]');
    lista.unshift(data);
    localStorage.setItem(KEY_LOG, JSON.stringify(lista.slice(0, 400)));
  } catch { /* noop */ }
}

export async function leerLog(n = 30) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('inventory_log')
        .select('*').order('fecha', { ascending: false }).limit(n);
      if (error) throw error;
      // Devuelve la misma forma que el modo local: { id, ...entrada, fecha }.
      return (data || []).map((r) => ({ id: r.id, ...(r.entrada || {}), fecha: r.fecha }));
    } catch { return []; }
  }
  try {
    return JSON.parse(localStorage.getItem(KEY_LOG) || '[]').slice(0, n);
  } catch { return []; }
}
