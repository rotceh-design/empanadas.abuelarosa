import { fmtCLP } from './formato';
import logoUrl from '../assets/abuela-rosa.png';
import empanadaUrl from '../assets/empanada.png';

const C = {
  fondo: '#F3E6C8',
  tinta: '#3E2213',
  tinta2: '#4A2C17',
  acento: '#8B4513',
  verde: '#3B7A3E',
};

const F_TITULO = 'Ultra, Georgia, serif';
const F_SERIF = 'Cinzel, Georgia, serif';
const F_CUERPO = '"Crimson Pro", Georgia, serif';

const ETIQUETAS = {
  vegana: 'Vegana',
  vegetariana: 'Vegetariana',
  pescado: 'Con pescado',
  marisco: 'Con marisco',
  picante: 'Picante',
};

const W = 880;
const M = 80;
const R = W - M;
const CX = W / 2;

function cargarImagen(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function cargarFuentes() {
  if (!document.fonts?.load) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`400 54px ${F_TITULO}`),
        document.fonts.load(`600 24px ${F_SERIF}`),
        document.fonts.load(`700 24px ${F_SERIF}`),
        document.fonts.load(`400 22px ${F_CUERPO}`),
        document.fonts.load(`italic 400 22px ${F_CUERPO}`),
      ]),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch { /* usa fuentes de respaldo */ }
}

function redondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function envolver(ctx, texto, maxW) {
  const palabras = String(texto || '').split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const t = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(t).width <= maxW || !actual) actual = t;
    else { lineas.push(actual); actual = p; }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function textoEspaciado(ctx, txt, x, y, esp, alinear = 'center') {
  const chars = [...String(txt)];
  const total = chars.reduce((s, c) => s + ctx.measureText(c).width, 0) + esp * Math.max(chars.length - 1, 0);
  let cx = alinear === 'center' ? x - total / 2 : alinear === 'right' ? x - total : x;
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + esp;
  }
  return total;
}

function ornamento(ctx, y) {
  ctx.strokeStyle = 'rgba(74,44,23,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(CX - 26, y);
  ctx.moveTo(CX + 26, y);
  ctx.lineTo(R, y);
  ctx.stroke();
  ctx.fillStyle = C.acento;
  ctx.beginPath();
  ctx.moveTo(CX, y - 6);
  ctx.lineTo(CX + 6, y);
  ctx.lineTo(CX, y + 6);
  ctx.lineTo(CX - 6, y);
  ctx.closePath();
  ctx.fill();
}

function seccion(ctx, txt, y) {
  ctx.font = `600 19px ${F_SERIF}`;
  ctx.fillStyle = 'rgba(62,34,19,0.55)';
  ctx.textAlign = 'left';
  textoEspaciado(ctx, txt, M, y, 4, 'left');
  return y + 36;
}

function parLinea(ctx, etiqueta, valor, y) {
  ctx.font = `600 17px ${F_SERIF}`;
  ctx.fillStyle = 'rgba(62,34,19,0.55)';
  ctx.textAlign = 'left';
  textoEspaciado(ctx, etiqueta, M, y, 3, 'left');
  ctx.font = `italic 400 22px ${F_CUERPO}`;
  ctx.fillStyle = C.tinta2;
  ctx.textAlign = 'left';
  const lineas = envolver(ctx, valor, R - (M + 175));
  let yy = y;
  for (const l of lineas) {
    ctx.fillText(l, M + 175, yy);
    yy += 29;
  }
  return yy - y + 8;
}

function dibujarLogo(ctx, logo) {
  const r = 88;
  const cy = 70 + r;
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const lado = Math.min(logo.width, logo.height);
  ctx.drawImage(logo, (logo.width - lado) / 2, (logo.height - lado) / 2, lado, lado, CX - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.strokeStyle = C.acento;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(CX, cy, r + 4, 0, Math.PI * 2);
  ctx.stroke();
  return cy + r + 34;
}

function dibujarItems(ctx, pedido, y) {
  const items = pedido.items || [];
  items.forEach((it, idx) => {
    const cantidad = it.cantidad || 1;
    const unit = it.precioUnitario ?? it.precio ?? 0;
    const total = unit * cantidad;

    ctx.textAlign = 'left';
    ctx.font = `700 24px ${F_SERIF}`;
    ctx.fillStyle = C.tinta;
    const nombre = cantidad > 1 ? `${it.nombre} ×${cantidad}` : it.nombre;
    ctx.fillText(nombre, M, y);
    if (it.esDelDia) {
      const anchoNombre = ctx.measureText(nombre).width;
      ctx.font = `600 16px ${F_SERIF}`;
      ctx.fillStyle = C.acento;
      textoEspaciado(ctx, 'DEL DÍA', M + anchoNombre + 12, y - 2, 2, 'left');
    }
    if (total > 0) {
      ctx.textAlign = 'right';
      ctx.font = `600 23px ${F_SERIF}`;
      ctx.fillStyle = C.tinta;
      ctx.fillText(fmtCLP(total), R, y);
    }
    y += 30;

    const detalle = [it.proteina, it.queso].filter(Boolean).join(' · ');
    if (detalle) {
      ctx.textAlign = 'left';
      ctx.font = `italic 400 21px ${F_CUERPO}`;
      ctx.fillStyle = 'rgba(74,44,23,0.8)';
      for (const l of envolver(ctx, detalle, R - M)) { ctx.fillText(l, M, y); y += 27; }
    }
    if (it.acompanamientos?.length) {
      ctx.textAlign = 'left';
      ctx.font = `italic 400 20px ${F_CUERPO}`;
      ctx.fillStyle = 'rgba(74,44,23,0.65)';
      for (const l of envolver(ctx, it.acompanamientos.join(', '), R - M)) { ctx.fillText(l, M, y); y += 26; }
    }
    if (it.extrasCount > 0) {
      ctx.textAlign = 'left';
      ctx.font = `italic 400 19px ${F_CUERPO}`;
      ctx.fillStyle = C.acento;
      ctx.fillText(`Extras: ${it.extrasCount}`, M, y);
      y += 25;
    }
    if (it.etiquetas?.length) {
      const txt = it.etiquetas.map((id) => ETIQUETAS[id] || id).join(' · ');
      ctx.textAlign = 'left';
      ctx.font = `italic 400 19px ${F_CUERPO}`;
      ctx.fillStyle = 'rgba(74,44,23,0.55)';
      ctx.fillText(txt, M, y);
      y += 25;
    }

    if (idx < items.length - 1) {
      y += 6;
      ctx.strokeStyle = 'rgba(74,44,23,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(R, y);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 18;
    }
  });
  return y;
}

function dibujarOferta(ctx, pedido, y) {
  const ahorro = pedido.oferta?.ahorro || 0;
  if (ahorro <= 0) return y;
  const detalle = (pedido.oferta?.detalle || []).join(' + ');
  ctx.textAlign = 'left';
  ctx.font = `italic 400 20px ${F_CUERPO}`;
  const lineas = envolver(ctx, `Oferta aplicada: ${detalle}`, R - M - 36);
  const alto = lineas.length * 26 + 46;
  ctx.fillStyle = 'rgba(59,122,62,0.10)';
  ctx.strokeStyle = 'rgba(59,122,62,0.45)';
  ctx.lineWidth = 1.5;
  redondeado(ctx, M - 12, y, R - M + 24, alto, 14);
  ctx.fill();
  ctx.stroke();
  let yy = y + 30;
  ctx.fillStyle = 'rgba(74,44,23,0.85)';
  for (const l of lineas) { ctx.fillText(l, M, yy); yy += 26; }
  ctx.textAlign = 'center';
  ctx.font = `700 21px ${F_SERIF}`;
  ctx.fillStyle = C.verde;
  ctx.fillText(`AHORRAS ${fmtCLP(ahorro)}`, CX, y + alto - 16);
  return y + alto + 22;
}

function dibujarTotales(ctx, pedido, y) {
  const t = pedido.totales || {};
  ctx.strokeStyle = 'rgba(74,44,23,0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(R, y);
  ctx.stroke();
  y += 38;

  const filas = [['Subtotal', fmtCLP(t.subtotal || 0), C.tinta2]];
  if ((t.ahorro || 0) > 0) filas.push(['Ahorro', `-${fmtCLP(t.ahorro)}`, C.verde]);
  filas.push(['Delivery', t.delivery === 0 ? 'GRATIS' : fmtCLP(t.delivery || 0), t.delivery === 0 ? C.verde : C.tinta2]);

  for (const [et, val, col] of filas) {
    ctx.textAlign = 'left';
    ctx.font = `italic 400 23px ${F_CUERPO}`;
    ctx.fillStyle = 'rgba(74,44,23,0.8)';
    ctx.fillText(et, M, y);
    ctx.textAlign = 'right';
    ctx.font = `600 23px ${F_SERIF}`;
    ctx.fillStyle = col;
    ctx.fillText(val, R, y);
    y += 36;
  }

  y += 4;
  ctx.strokeStyle = C.tinta2;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(R, y);
  ctx.stroke();
  y += 44;

  ctx.textAlign = 'left';
  ctx.font = `700 26px ${F_SERIF}`;
  ctx.fillStyle = C.tinta;
  textoEspaciado(ctx, 'TOTAL', M, y, 4, 'left');
  ctx.textAlign = 'right';
  ctx.font = `400 42px ${F_TITULO}`;
  ctx.fillStyle = C.tinta;
  ctx.fillText(fmtCLP(t.total || 0), R, y);
  return y + 30;
}

function pintar(ctx, pedido, logo, empanada, whatsapp) {
  let y = dibujarLogo(ctx, logo);

  ctx.textAlign = 'center';
  ctx.font = `600 23px ${F_SERIF}`;
  ctx.fillStyle = C.acento;
  textoEspaciado(ctx, 'EMPANADAS ABUELA ROSA', CX, y, 5, 'center');
  y += 52;

  const num = String(pedido.numero || '').padStart(4, '0');
  ctx.font = `400 54px ${F_TITULO}`;
  ctx.fillStyle = C.tinta;
  ctx.fillText(`PEDIDO #${num}`, CX, y);
  y += 42;

  const fecha = new Date(pedido.createdAt || Date.now()).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  ctx.font = `italic 400 22px ${F_CUERPO}`;
  ctx.fillStyle = 'rgba(74,44,23,0.75)';
  ctx.fillText(fecha, CX, y);
  y += 34;

  ornamento(ctx, y);
  y += 44;

  y = seccion(ctx, 'TU PEDIDO', y);
  y = dibujarItems(ctx, pedido, y);
  y = dibujarOferta(ctx, pedido, y);
  y = dibujarTotales(ctx, pedido, y);

  y += 14;
  ornamento(ctx, y);
  y += 44;

  y = seccion(ctx, 'DATOS DE ENTREGA', y);
  const c = pedido.cliente || {};
  y += parLinea(ctx, 'CLIENTE', c.nombre || '—', y);
  y += parLinea(ctx, 'TELÉFONO', c.telefono || '—', y);
  y += parLinea(ctx, 'DIRECCIÓN', [c.direccion, c.comuna].filter(Boolean).join(', ') || '—', y);
  y += parLinea(ctx, 'ENTREGA', [pedido.entrega?.fecha, pedido.entrega?.hora].filter(Boolean).join(' a las ') || '—', y);
  if (c.referencias) y += parLinea(ctx, 'REFERENCIAS', c.referencias, y);

  y += 14;
  ornamento(ctx, y);
  y += 54;

  const lado = 62;
  ctx.drawImage(empanada, CX - lado / 2, y - lado / 2, lado, lado);
  y += lado / 2 + 30;

  ctx.textAlign = 'center';
  ctx.font = `italic 400 21px ${F_CUERPO}`;
  ctx.fillStyle = 'rgba(74,44,23,0.7)';
  ctx.fillText('Empanadas fritas al momento — con queso que se derrite', CX, y);
  y += 32;

  if (whatsapp) {
    ctx.font = `600 18px ${F_SERIF}`;
    ctx.fillStyle = C.acento;
    textoEspaciado(ctx, `PEDIDOS · +${whatsapp}`, CX, y, 3, 'center');
    y += 34;
  }

  return y;
}

export async function generarImagenTicket(pedido, { whatsapp = '' } = {}) {
  await cargarFuentes();
  const [logo, empanada] = await Promise.all([cargarImagen(logoUrl), cargarImagen(empanadaUrl)]);
  const S = 2;

  const med = document.createElement('canvas');
  med.width = 4;
  med.height = 4;
  const mctx = med.getContext('2d');
  mctx.setTransform(S, 0, 0, S, 0, 0);
  mctx.textBaseline = 'alphabetic';
  const yFinal = pintar(mctx, pedido, logo, empanada, whatsapp);

  const H = Math.ceil(yFinal + 54);
  const out = document.createElement('canvas');
  out.width = W * S;
  out.height = H * S;
  const o = out.getContext('2d');
  o.setTransform(S, 0, 0, S, 0, 0);
  o.textBaseline = 'alphabetic';
  o.fillStyle = C.fondo;
  o.fillRect(0, 0, W, H);
  pintar(o, pedido, logo, empanada, whatsapp);

  o.strokeStyle = C.tinta2;
  o.lineWidth = 7;
  redondeado(o, 20, 20, W - 40, H - 40, 30);
  o.stroke();
  o.lineWidth = 2;
  redondeado(o, 36, 36, W - 72, H - 72, 20);
  o.stroke();

  return out.toDataURL('image/png');
}
