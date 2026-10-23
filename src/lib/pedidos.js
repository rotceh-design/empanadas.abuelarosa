import { supabase, isSupabaseConfigured, mapOrder } from './supabase';
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
  if (!isSupabaseConfigured) {
    oyentes.add(cb);
    // Otra pestaña (la tienda) que escriba el mismo storage: Supabase no
    // existe en modo demo, así que este evento es su equivalente local.
    const enOtraPestana = (e) => { if (e.key === KEY) cb(localLeer()); };
    if (typeof window !== 'undefined') window.addEventListener('storage', enOtraPestana);
    cb(localLeer());
    return () => {
      oyentes.delete(cb);
      if (typeof window !== 'undefined') window.removeEventListener('storage', enOtraPestana);
    };
  }

  let cancelado = false;
  const cargar = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (cancelado) return;
    if (error) { console.warn('No se pudieron leer los pedidos:', error); return; }
    cb((data || []).map(mapOrder));
  };

  cargar();

  // Realtime: recargamos la lista ante cualquier cambio (más simple y
  // consistente que reconstruir desde los payloads individuales).
  const canal = supabase
    .channel(`pedidos-${uid()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => cargar())
    .subscribe();

  return () => { cancelado = true; supabase.removeChannel(canal); };
}

// Carga TODOS los pedidos de un rango (paginado), para reportes históricos:
// el panel muestra los últimos 200, pero los reportes necesitan el histórico
// completo sin importar cuántos pedidos existan.
export async function cargarPedidosRango(desde, hasta) {
  const d = desde || '1970-01-01T00:00:00.000Z';
  const h = hasta || '2999-01-01T00:00:00.000Z';
  if (!isSupabaseConfigured) {
    return localLeer().filter((o) => {
      const t = Date.parse(o.createdAt || '');
      return t >= Date.parse(d) && t < Date.parse(h);
    });
  }
  const salida = [];
  const tam = 1000;
  for (let salto = 0; ; salto += tam) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', d)
      .lt('created_at', h)
      .order('created_at', { ascending: false })
      .range(salto, salto + tam - 1);
    if (error) throw error;
    salida.push(...(data || []).map(mapOrder));
    if (!data || data.length < tam) break;
  }
  return salida;
}

export async function crearPedido(pedido) {
  const numero = await siguienteNumero();
  const data = {
    numero,
    status: 'pendiente_pago',
    cliente: pedido.cliente || {},
    items: pedido.items || [],
    totales: pedido.totales || {},
    oferta: pedido.oferta || null,
    entrega: pedido.entrega || null,
    etiquetas: pedido.etiquetas || [],
    comprobante: pedido.comprobante || null,
    fuente: pedido.fuente || 'web',
  };

  if (!isSupabaseConfigured) {
    const lista = localLeer();
    const createdAt = new Date().toISOString();
    lista.unshift({ id: uid(), ...data, createdAt, stockDescontado: false });
    localEscribir(lista);
    return { id: lista[0].id, ...data, createdAt };
  }

  try {
    const { data: fila, error } = await supabase
      .from('orders')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    await registrarStats(pedido);
    await registrarCliente(pedido);
    return mapOrder(fila);
  } catch (e) {
    console.warn('No se pudo crear el pedido en Supabase, se guarda local:', e);
    const lista = localLeer();
    const createdAt = new Date().toISOString();
    lista.unshift({ id: uid(), ...data, createdAt, stockDescontado: false });
    localEscribir(lista);
    return { id: lista[0].id, ...data, createdAt };
  }
}

// Reserva el siguiente número de pedido de forma atómica: dos pedidos
// simultáneos nunca pueden quedarse con el mismo número.
async function siguienteNumero() {
  if (!isSupabaseConfigured) return localLeer().length + 101;
  try {
    const { data, error } = await supabase.rpc('next_order_number');
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('No se pudo reservar el número de pedido:', e);
    return Math.floor(Math.random() * 9000) + 100;
  }
}

async function registrarStats(pedido) {
  if (!isSupabaseConfigured) return;
  try {
    const empanadas = pedido.items?.filter((i) => i.tipo === 'empanada') || [];
    for (const e of empanadas) {
      if (!e.clave) continue;
      const { error } = await supabase.rpc('register_order_stats', {
        p_clave: e.clave,
        p_nombre: e.nombre,
        p_emojis: e.emojis || [],
        p_proteina_id: e.proteinaId,
        p_queso_id: e.quesoId,
        p_acomp_ids: e.acompanamientosIds || [],
        p_cantidad: e.cantidad || 1,
      });
      if (error) throw error;
    }
  } catch { /* noop */ }
}

async function registrarCliente(pedido) {
  if (!isSupabaseConfigured || !pedido.cliente?.telefono) return;
  try {
    const { error } = await supabase.rpc('upsert_customer', {
      p_telefono: pedido.cliente.telefono,
      p_nombre: pedido.cliente.nombre,
      p_comuna: pedido.cliente.comuna,
      p_clave: pedido.items?.find((i) => i.tipo === 'empanada')?.clave || null,
    });
    if (error) throw error;
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
  const campos = { status, updated_at: new Date().toISOString() };

  const signo = ctx && typeof pedido === 'object' ? signoStock(pedido, status) : 0;
  if (signo !== 0) {
    try {
      await aplicarStock(pedido, signo, ctx);
      campos.stock_descontado = signo === 1;
    } catch (e) {
      console.warn('No se pudo ajustar el stock:', e);
    }
  }

  if (!isSupabaseConfigured) {
    const lista = localLeer().map((o) => (o.id === orderId
      ? { ...o, status, actualizadoEn: campos.updated_at, stockDescontado: campos.stock_descontado ?? o.stockDescontado }
      : o));
    localEscribir(lista);
    return;
  }
  try {
    const { error } = await supabase.from('orders').update(campos).eq('id', orderId);
    if (error) throw error;
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
