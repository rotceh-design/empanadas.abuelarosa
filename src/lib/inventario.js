// Persistencia de inventario dual: Firestore cuando está configurado,
// localStorage (overlay sobre los seeds) cuando corre en modo demo/local.
import {
  collection, doc, setDoc, deleteDoc, addDoc, getDocs, writeBatch,
  query, orderBy, limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
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
  if (isFirebaseConfigured) {
    await setDoc(doc(db, coleccion, id), datos, { merge: true });
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
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, coleccion, id));
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

// Merge profundo de maps, igual que setDoc(..., { merge: true }) en Firestore:
// un patch parcial { inventario: { umbral } } no pisa el resto de `inventario`.
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
  if (isFirebaseConfigured) {
    await setDoc(doc(db, 'settings', 'main'), parcial, { merge: true });
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

  const parchesIng = {};
  Object.entries(consumo.ings).forEach(([id, gramos]) => {
    const ing = porId[id];
    if (!ing || typeof ing.stockGramos !== 'number') return;
    parchesIng[id] = { stockGramos: Math.max(0, Math.round(ing.stockGramos - signo * gramos)) };
  });

  const parchesBeb = {};
  Object.entries(consumo.bebs).forEach(([id, unidades]) => {
    const b = bebidas.find((x) => x.id === id);
    if (!b || typeof b.stockUnidades !== 'number') return;
    parchesBeb[id] = { stockUnidades: Math.max(0, b.stockUnidades - signo * unidades) };
  });

  const invActual = settings.inventario || {};
  const hayMasa = typeof invActual.masaGramos === 'number' && consumo.masaGramos > 0;
  const masaGramos = hayMasa
    ? Math.max(0, invActual.masaGramos - signo * consumo.masaGramos)
    : invActual.masaGramos;

  if (!isFirebaseConfigured) {
    Object.entries(parchesIng).forEach(([id, datos]) => parcheOverlay('ingredientes', id, datos));
    Object.entries(parchesBeb).forEach(([id, datos]) => parcheOverlay('bebidas', id, datos));
    if (hayMasa) guardarSettingsPatch({ inventario: { ...invActual, masaGramos } });
    return true;
  }

  const batch = writeBatch(db);
  Object.entries(parchesIng).forEach(([id, datos]) => {
    batch.set(doc(db, 'ingredients', id), datos, { merge: true });
  });
  Object.entries(parchesBeb).forEach(([id, datos]) => {
    batch.set(doc(db, 'drinks', id), datos, { merge: true });
  });
  if (hayMasa) {
    batch.set(doc(db, 'settings', 'main'), { inventario: { ...invActual, masaGramos } }, { merge: true });
  }
  await batch.commit();
  return true;
}

// Historial de movimientos (compras y conteos).
export async function registrarMovimiento(entrada) {
  // Firestore rechaza undefined: limpiamos los campos que no aplican a este movimiento.
  const data = Object.fromEntries(
    Object.entries({ ...entrada, fecha: new Date().toISOString() }).filter(([, v]) => v !== undefined),
  );
  if (isFirebaseConfigured) {
    try { await addDoc(collection(db, 'inventory_log'), data); } catch (e) { console.warn('No se registró el movimiento:', e); }
    return;
  }
  try {
    const lista = JSON.parse(localStorage.getItem(KEY_LOG) || '[]');
    lista.unshift(data);
    localStorage.setItem(KEY_LOG, JSON.stringify(lista.slice(0, 400)));
  } catch { /* noop */ }
}

export async function leerLog(n = 30) {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(query(collection(db, 'inventory_log'), orderBy('fecha', 'desc'), limit(n)));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  }
  try {
    return JSON.parse(localStorage.getItem(KEY_LOG) || '[]').slice(0, n);
  } catch { return []; }
}
