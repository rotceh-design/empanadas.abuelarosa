import { fmtCLP } from './formato';
import { generarImagenTicket } from './comprobanteImagen';

// Número fijo de pedidos: wa.me solo acepta dígitos (sin "+" ni espacios).
export const WHATSAPP_PEDIDOS = '56935438480';

const ETIQUETAS_TXT = {
  vegana: '🌱 Vegana',
  vegetariana: '🥬 Vegetariana',
  pescado: '🐟 Con pescado',
  marisco: '🦐 Con marisco',
  picante: '🌶️ Picante',
};

export function generarTicket(pedido = {}) {
  const l = [];
  const fecha = new Date(pedido.createdAt || Date.now()).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  l.push('🥟 *EMPANADAS ABUELA ROSA*');
  l.push('Maipú, Santiago');
  l.push('━━━━━━━━━━━━━━━━━━━━');
  l.push(`Pedido *#${String(pedido.numero ?? '').padStart(4, '0')}* — ${fecha}`);
  l.push('━━━━━━━━━━━━━━━━━━━━');
  l.push('');

  (pedido.items || []).forEach((it) => {
    const cant = it.cantidad || 1;
    const unit = typeof it.precioUnitario === 'number'
      ? it.precioUnitario
      : typeof it.precio === 'number' ? it.precio : null;
    const precio = unit == null ? '' : ` — ${fmtCLP(unit)} c/u · ${fmtCLP(unit * cant)}`;
    if (it.tipo === 'bebida') {
      l.push(`🥤 *${it.nombre}* ×${cant}${precio}`);
      return;
    }
    l.push(`*🥟 ${it.nombre}* ×${cant}${precio}`);
    if (it.proteina) l.push(`  🥩 ${it.proteina}`);
    if (it.queso) l.push(`  🧀 ${it.queso}`);
    if (it.acompanamientos?.length) l.push(`  🥗 ${it.acompanamientos.join(', ')}`);
    if (it.extrasCount > 0) l.push(`  ⬆️ ${it.extrasCount} extra(s)`);
    if (it.etiquetas?.length) {
      const txt = it.etiquetas.map((id) => ETIQUETAS_TXT[id] || id).join(' · ');
      l.push(`  🏷️ ${txt}`);
    }
    l.push('');
  });

  if (pedido.oferta?.ahorro > 0) {
    l.push(`🎁 Oferta aplicada: ${pedido.oferta.detalle.join(' + ')}`);
    l.push(`   Ahorras *${fmtCLP(pedido.oferta.ahorro)}*`);
    l.push('');
  }

  const t = pedido.totales || {};
  l.push('━━━━━━━━━━━━━━━━━━━━');
  if (typeof t.subtotal === 'number') l.push(`Subtotal: *${fmtCLP(t.subtotal)}*`);
  if ((t.ahorro || 0) > 0) l.push(`Ahorro: *-${fmtCLP(t.ahorro)}*`);
  if (typeof t.delivery === 'number') l.push(`Delivery: ${t.delivery === 0 ? '*GRATIS* 🎉' : `*${fmtCLP(t.delivery)}*`}`);
  if (typeof t.total === 'number') l.push(`*TOTAL: ${fmtCLP(t.total)}*`);
  l.push('━━━━━━━━━━━━━━━━━━━━');
  l.push('');

  const c = pedido.cliente || {};
  if (c.nombre) l.push(`👤 ${c.nombre}`);
  if (c.telefono) l.push(`📞 ${c.telefono}`);
  if (c.direccion || c.comuna) l.push(`📍 ${[c.direccion, c.comuna].filter(Boolean).join(', ')}`);
  if (c.referencias) l.push(`🔎 ${c.referencias}`);
  const e = pedido.entrega || {};
  if (e.fecha) l.push(`🗓️ Entrega: ${e.fecha}${e.hora ? ` a las ${e.hora}` : ''}`);
  l.push('');
  l.push('💰 *Para pagar:* te enviamos los datos de pago por este chat.');

  return l.join('\n');
}

export function linkWhatsApp(pedido, numero = WHATSAPP_PEDIDOS) {
  const num = (numero || '').replace(/[^0-9]/g, '') || WHATSAPP_PEDIDOS;
  return `https://wa.me/${num}?text=${encodeURIComponent(generarTicket(pedido))}`;
}

// Convierte un dataURL (comprobante guardado en el pedido) en File listo para compartir.
export function dataUrlAFile(dataUrl, nombre = 'comprobante.jpg') {
  const [cab, base] = dataUrl.split(',');
  const tipo = (cab.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
  const bin = atob(base);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = tipo.includes('png') ? 'png' : tipo.includes('webp') ? 'webp' : 'jpg';
  return new File([bytes], nombre.replace(/\.\w+$/, `.${ext}`), { type: tipo });
}

// Genera la imagen del ticket en composición vintage y la devuelve como File.
export async function imagenTicketFile(pedido, whatsapp = '') {
  const dataUrl = await generarImagenTicket(pedido, { whatsapp });
  const num = String(pedido.numero || '').padStart(4, '0');
  return dataUrlAFile(dataUrl, `ticket-${num}.png`);
}

function descargarArchivo(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Abre WhatsApp (wa.me) con el detalle COMPLETO del pedido hacia el número fijo
// de pedidos, y descarga el comprobante (si existe) para adjuntarlo en el chat.
// Devuelve: 'texto' | 'error'
export async function enviarPedidoWhatsApp({ pedido, comprobanteDataUrl = null }) {
  try {
    if (!pedido?.items?.length) return 'error';
    window.open(linkWhatsApp(pedido), '_blank', 'noopener');
    if (comprobanteDataUrl?.startsWith('data:')) {
      try {
        const num = String(pedido.numero ?? '').padStart(4, '0');
        descargarArchivo(dataUrlAFile(comprobanteDataUrl, `comprobante-${num}`));
      } catch { /* comprobante opcional */ }
    }
    return 'texto';
  } catch {
    return 'error';
  }
}
