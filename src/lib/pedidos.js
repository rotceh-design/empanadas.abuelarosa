import {
  collection, addDoc, doc, getDoc, setDoc, increment, runTransaction,
  query, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { uid } from './formato';
import { signoStock } from './stock';
import { aplicarStock } from './inventario';

const KEY = 'empanadas_pedidos_local';

// Suscriptores del modo local (demo). Sin esto el panel nunca se enteraba
// de que nació un pedido hasta volver a montar la página.
const oyentes = new Set();

function localLeer() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function localEscribir(lista) {
  try { localStorage.setItem(KEY, JSON.stringify(lista)); } catch { /* noop */ }
  oyentes.forEach((cb) => { try { cb(lista); } catch { /* noop */ } });
}

export function observarPedidos(cb) {
  if (!isFirebaseConfigured) {
    oyentes.add(cb);
    // Otra pestaña (la tienda) que escriba el mismo storage: Firestore no
    // existe en modo demo, así que este evento es su equivalente local.
    const enOtraPestana = (e) => { if (e.key === KEY) cb(localLeer()); };
    if (typeof window !== 'undefined') window.addEventListener('storage', enOtraPestana);
    cb(localLeer());
    return () => {
      oyentes.delete(cb);
      if (typeof window !== 'undefined') window.removeEventListener('storage', enOtraPestana);
    };
  }
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
    return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb(localLeer()));
  } catch {
    cb(localLeer());
    return () => {};
  }
}

export async function crearPedido(pedido) {
  const numero = await siguienteNumero();
  const data = {
    ...pedido,
    numero,
    status: 'pendiente_pago',
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured) {
    const lista = localLeer();
    lista.unshift({ id: uid(), ...data });
    localEscribir(lista);
    return { id: lista[0].id, ...data };
  }

  try {
    const ref = await addDoc(collection(db, 'orders'), data);
    await registrarStats(pedido);
    await registrarCliente(pedido);
    return { id: ref.id, ...data };
  } catch {
    const lista = localLeer();
    lista.unshift({ id: uid(), ...data });
    localEscribir(lista);
    return { id: lista[0].id, ...data };
  }
}

// Reserva el siguiente número de pedido de forma atómica: dos pedidos
// simultáneos nunca pueden quedarse con el mismo número.
async function siguienteNumero() {
  if (!isFirebaseConfigured) return localLeer().length + 101;
  const ref = doc(db, 'counters', 'orders');
  for (let intento = 0; intento < 3; intento++) {
    try {
      let siguiente = 101;
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const actual = snap.exists() ? Number(snap.data().valor) || 100 : 100;
        siguiente = actual + 1;
        tx.set(ref, { valor: siguiente }, { merge: true });
      });
      return siguiente;
    } catch (e) {
      if (intento === 2) console.warn('No se pudo reservar el número de pedido:', e);
    }
  }
  // Último recurso si Firestore no está disponible: número no persistido.
  return Math.floor(Math.random() * 9000) + 100;
}

async function registrarStats(pedido) {
  if (!isFirebaseConfigured) return;
  try {
    const empanadas = pedido.items?.filter((i) => i.tipo === 'empanada') || [];
    for (const e of empanadas) {
      if (!e.clave) continue;
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'stats', e.clave);
        const snap = await tx.get(ref);
        const actual = snap.exists() ? snap.data().count || 0 : 0;
        tx.set(ref, {
          count: actual + (e.cantidad || 1),
          nombre: e.nombre,
          emojis: e.emojis || [],
          proteinaId: e.proteinaId,
          quesoId: e.quesoId,
          acompanamientosIds: e.acompanamientosIds || [],
        }, { merge: true });
      });
    }
    const refC = doc(db, 'counters', 'combinaciones');
    const snapC = await getDoc(refC);
    if (snapC.exists()) await setDoc(refC, { valor: increment(1) }, { merge: true });
    else await setDoc(refC, { valor: 1 });
  } catch { /* noop */ }
}

async function registrarCliente(pedido) {
  if (!isFirebaseConfigured || !pedido.cliente?.telefono) return;
  try {
    const ref = doc(db, 'customers', pedido.cliente.telefono.replace(/\s/g, ''));
    const snap = await getDoc(ref);
    const base = snap.exists() ? snap.data() : { puntos: 0, pedidos: 0, creado: new Date().toISOString() };
    await setDoc(ref, {
      ...base,
      nombre: pedido.cliente.nombre,
      telefono: pedido.cliente.telefono,
      comuna: pedido.cliente.comuna,
      pedidos: (base.pedidos || 0) + 1,
      puntos: (base.puntos || 0) + 50,
      ultimaCombinacion: pedido.items?.find((i) => i.tipo === 'empanada')?.clave || null,
      ultimaFecha: new Date().toISOString(),
    }, { merge: true });
  } catch { /* noop */ }
}

export const ESTADOS = [
  { id: 'pendiente_pago', label: 'Pendiente de pago', emoji: '⏳', color: '#E8A020' },
  { id: 'pago_confirmado', label: 'Pago confirmado', emoji: '💰', color: '#4E9A51' },
  { id: 'en_preparacion', label: 'En preparación', emoji: '🔥', color: '#F07613' },
  { id: 'en_reparto', label: 'En reparto', emoji: '🛵', color: '#5B8CB8' },
  { id: 'entregado', label: 'Entregado', emoji: '✅', color: '#3B7A3E' },
];

// Cambia el estado del pedido y, si corresponde, descuenta o devuelve stock
// (ctx = { porId, bebidas, settings } desde el catálogo).
export async function cambiarEstado(pedido, status, ctx = null) {
  const orderId = typeof pedido === 'object' ? pedido?.id : pedido;
  const campos = { status, actualizadoEn: new Date().toISOString() };

  const signo = ctx && typeof pedido === 'object' ? signoStock(pedido, status) : 0;
  if (signo !== 0) {
    try {
      await aplicarStock(pedido, signo, ctx);
      campos.stockDescontado = signo === 1;
    } catch (e) {
      console.warn('No se pudo ajustar el stock:', e);
    }
  }

  if (!isFirebaseConfigured) {
    const lista = localLeer().map((o) => (o.id === orderId ? { ...o, ...campos } : o));
    localEscribir(lista);
    return;
  }
  try {
    await setDoc(doc(db, 'orders', orderId), campos, { merge: true });
  } catch { /* noop */ }
}

export function diasProduccion(diasHabilitados = ['viernes', 'sábado', 'domingo']) {
  const mapa = { viernes: 5, sábado: 6, domingo: 0 };
  const hoy = new Date();
  const salidas = [];
  for (let i = 0; i < 14 && salidas.length < 6; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    const nombreDia = Object.keys(mapa).find((k) => mapa[k] === d.getDay());
    if (diasHabilitados.includes(nombreDia) && d >= hoy) {
      salidas.push({
        fecha: d.toISOString().slice(0, 10),
        etiqueta: d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' }),
        pasado: i === 0,
      });
    }
  }
  return salidas;
}
