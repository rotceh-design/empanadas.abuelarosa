import { fmtCLP } from './formato';
import { generarImagenTicket } from './comprobanteImagen';

const ETIQUETAS_TXT = {
  vegana: '🌱 Vegana',
  vegetariana: '🥬 Vegetariana',
  pescado: '🐟 Con pescado',
  marisco: '🦐 Con marisco',
  picante: '🌶️ Picante',
};

export function generarTicket(pedido) {
  const l = [];
  const fecha = new Date(pedido.createdAt || Date.now()).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  l.push('🥟 *EMPANADAS ABUELA ROSA*');
  l.push('Maipú, Santiago');
  l.push('━━━━━━━━━━━━━━━━━━━━');
  l.push(`Pedido *#${String(pedido.numero).padStart(4, '0')}* — ${fecha}`);
  l.push('━━━━━━━━━━━━━━━━━━━━');
  l.push('');

  (pedido.items || []).forEach((it) => {
    if (it.tipo === 'bebida') {
      l.push(`🥤 *${it.nombre}* ×${it.cantidad}`);
      return;
    }
    l.push(`*🥟 ${it.nombre}* ×${it.cantidad}`);
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

  l.push('━━━━━━━━━━━━━━━━━━━━');
  l.push(`Subtotal: *${fmtCLP(pedido.totales.subtotal)}*`);
  if (pedido.totales.ahorro > 0) l.push(`Ahorro: *-${fmtCLP(pedido.totales.ahorro)}*`);
  l.push(`Delivery: ${pedido.totales.delivery === 0 ? '*GRATIS* 🎉' : `*${fmtCLP(pedido.totales.delivery)}*`}`);
  l.push(`*TOTAL: ${fmtCLP(pedido.totales.total)}*`);
  l.push('━━━━━━━━━━━━━━━━━━━━');
  l.push('');
  l.push(`👤 ${pedido.cliente.nombre}`);
  l.push(`📞 ${pedido.cliente.telefono}`);
  l.push(`📍 ${pedido.cliente.direccion}, ${pedido.cliente.comuna}`);
  if (pedido.cliente.referencias) l.push(`🔎 ${pedido.cliente.referencias}`);
  l.push(`🗓️ Entrega: ${pedido.entrega.fecha} a las ${pedido.entrega.hora}`);
  l.push('');
  l.push('💰 *Para pagar:* te enviamos los datos de pago por este chat.');

  return l.join('\n');
}

export function linkWhatsApp(pedido, numero) {
  const num = (numero || '').replace(/[^0-9]/g, '');
  const texto = encodeURIComponent(generarTicket(pedido));
  return `https://wa.me/${num}?text=${texto}`;
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

// Envía el ticket como IMAGEN (+ comprobante de pago si existe) al WhatsApp del negocio.
// Devuelve: 'compartido' | 'cancelado' | 'texto' | 'error'
export async function enviarPedidoWhatsApp({ pedido, comprobanteDataUrl = null, numero }) {
  const num = (numero || '').replace(/[^0-9]/g, '');
  const numPedido = String(pedido.numero || '').padStart(4, '0');
  const archivos = [];

  try {
    archivos.push(await imagenTicketFile(pedido, num));
  } catch { /* si falla la imagen, seguimos con el respaldo */ }

  if (comprobanteDataUrl?.startsWith('data:')) {
    try {
      archivos.push(dataUrlAFile(comprobanteDataUrl, `comprobante-${numPedido}`));
    } catch { /* comprobante opcional */ }
  }

  if (archivos.length && navigator.canShare?.({ files: archivos })) {
    try {
      await navigator.share({ files: archivos });
      return 'compartido';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelado';
    }
  }

  try {
    if (archivos[0]) descargarArchivo(archivos[0]);
    const texto = archivos.length
      ? `Pedido #${numPedido} — te comparto la imagen del ticket (ya la descargué, súmala al chat).`
      : generarTicket(pedido);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    return 'texto';
  } catch {
    return 'error';
  }
}
