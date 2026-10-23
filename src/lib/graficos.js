// Gráficos simples en canvas (sin dependencias) → PNG para Excel y Word.
// Solo funciona en navegador; en node se omiten (los tests validan el resto).

const PALETA = ['#8b4513', '#b5763a', '#4e9a51', '#f07613', '#5b8cb8', '#b5402f', '#7a5c2e', '#3b7a3e'];

function lienzo(ancho, alto) {
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const g = canvas.getContext('2d');
  g.fillStyle = '#f3e6c8';
  g.fillRect(0, 0, ancho, alto);
  return { canvas, g };
}

function marco(g, titulo, ancho, alto) {
  g.strokeStyle = '#4a2c17';
  g.lineWidth = 3;
  g.strokeRect(6, 6, ancho - 12, alto - 12);
  g.fillStyle = '#4a2c17';
  g.font = 'bold 18px Georgia, serif';
  g.textAlign = 'center';
  g.fillText(titulo, ancho / 2, 32);
}

function miles(n) {
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

// Barras verticales. puntos: [{ etiqueta, valor }].
export function graficoBarras(puntos, { titulo = '', ancho = 640, alto = 300, color = '#8b4513', etiquetasCada = 1 } = {}) {
  if (typeof document === 'undefined' || !puntos?.length) return null;
  const { canvas, g } = lienzo(ancho, alto);
  marco(g, titulo, ancho, alto);
  const izq = 56; const der = 16; const arr = 52; const aba = 40;
  const w = ancho - izq - der; const h = alto - arr - aba;
  const max = Math.max(...puntos.map((p) => p.valor), 1);
  const paso = w / puntos.length;
  const bw = Math.max(3, Math.min(42, paso * 0.62));
  // guías horizontales
  g.strokeStyle = '#4a2c1733';
  g.fillStyle = '#4a2c17aa';
  g.font = '11px sans-serif';
  g.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = arr + h - (h * i) / 4;
    g.beginPath(); g.moveTo(izq, y); g.lineTo(izq + w, y); g.stroke();
    g.fillText(miles((max * i) / 4), izq - 6, y + 4);
  }
  puntos.forEach((p, i) => {
    const bh = (p.valor / max) * h;
    const x = izq + i * paso + (paso - bw) / 2;
    g.fillStyle = i % 2 === 0 ? color : '#b5763a';
    g.fillRect(x, arr + h - bh, bw, bh);
    if (i % etiquetasCada === 0 && puntos.length <= 32) {
      g.save();
      g.translate(x + bw / 2, arr + h + 10);
      g.rotate(Math.PI / 4);
      g.fillStyle = '#4a2c17';
      g.font = '10px sans-serif';
      g.textAlign = 'left';
      g.fillText(String(p.etiqueta).slice(0, 12), 0, 0);
      g.restore();
    }
  });
  return canvas.toDataURL('image/png');
}

// Línea con área. puntos: [{ etiqueta, valor }].
export function graficoLinea(puntos, { titulo = '', ancho = 640, alto = 300, color = '#8b4513' } = {}) {
  if (typeof document === 'undefined' || !puntos?.length) return null;
  const { canvas, g } = lienzo(ancho, alto);
  marco(g, titulo, ancho, alto);
  const izq = 56; const der = 16; const arr = 52; const aba = 40;
  const w = ancho - izq - der; const h = alto - arr - aba;
  const max = Math.max(...puntos.map((p) => p.valor), 1);
  const px = (i) => izq + (puntos.length === 1 ? w / 2 : (i / (puntos.length - 1)) * w);
  const py = (v) => arr + h - (v / max) * h;
  g.strokeStyle = '#4a2c1733';
  g.fillStyle = '#4a2c17aa';
  g.font = '11px sans-serif';
  g.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = arr + h - (h * i) / 4;
    g.beginPath(); g.moveTo(izq, y); g.lineTo(izq + w, y); g.stroke();
    g.fillText(miles((max * i) / 4), izq - 6, y + 4);
  }
  // área
  g.beginPath();
  puntos.forEach((p, i) => (i === 0 ? g.moveTo(px(i), py(p.valor)) : g.lineTo(px(i), py(p.valor))));
  g.lineTo(px(puntos.length - 1), arr + h);
  g.lineTo(px(0), arr + h);
  g.closePath();
  g.fillStyle = `${color}33`;
  g.fill();
  // línea
  g.beginPath();
  g.strokeStyle = color;
  g.lineWidth = 2.5;
  puntos.forEach((p, i) => (i === 0 ? g.moveTo(px(i), py(p.valor)) : g.lineTo(px(i), py(p.valor))));
  g.stroke();
  // puntos + etiquetas cada N
  const cada = Math.max(1, Math.ceil(puntos.length / 12));
  puntos.forEach((p, i) => {
    g.beginPath();
    g.fillStyle = color;
    g.arc(px(i), py(p.valor), 3, 0, Math.PI * 2);
    g.fill();
    if (i % cada === 0) {
      g.fillStyle = '#4a2c17';
      g.font = '10px sans-serif';
      g.textAlign = 'center';
      g.fillText(String(p.etiqueta).slice(0, 10), px(i), arr + h + 14);
    }
  });
  return canvas.toDataURL('image/png');
}

// Anillo (dona). puntos: [{ etiqueta, valor }] — top 6 + "Otros".
export function graficoDona(puntos, { titulo = '', ancho = 420, alto = 300 } = {}) {
  if (typeof document === 'undefined' || !puntos?.length) return null;
  const ordenados = [...puntos].sort((a, b) => b.valor - a.valor);
  const top = ordenados.slice(0, 6).filter((p) => p.valor > 0);
  const resto = ordenados.slice(6).reduce((s, p) => s + p.valor, 0);
  const datos = resto > 0 ? [...top, { etiqueta: 'Otros', valor: resto }] : top;
  if (!datos.length) return null;
  const { canvas, g } = lienzo(ancho, alto);
  marco(g, titulo, ancho, alto);
  const total = datos.reduce((s, d) => s + d.valor, 0) || 1;
  const cx = 150; const cy = 170; const radio = 92; const interior = 50;
  let ang = -Math.PI / 2;
  datos.forEach((d, i) => {
    const frac = d.valor / total;
    const fin = ang + frac * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, radio, ang, fin);
    g.closePath();
    g.fillStyle = PALETA[i % PALETA.length];
    g.fill();
    g.strokeStyle = '#f3e6c8';
    g.lineWidth = 2;
    g.stroke();
    ang = fin;
  });
  // centro
  g.beginPath();
  g.fillStyle = '#f3e6c8';
  g.arc(cx, cy, interior, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#4a2c17';
  g.font = 'bold 20px Georgia, serif';
  g.textAlign = 'center';
  g.fillText(String(Math.round((datos[0].valor / total) * 100)) + '%', cx, cy + 6);
  // leyenda
  g.textAlign = 'left';
  g.font = '12px sans-serif';
  datos.forEach((d, i) => {
    const y = 70 + i * 26;
    g.fillStyle = PALETA[i % PALETA.length];
    g.fillRect(280, y - 10, 14, 14);
    g.fillStyle = '#4a2c17';
    g.fillText(`${String(d.etiqueta).slice(0, 14)} (${Math.round((d.valor / total) * 100)}%)`, 300, y + 2);
  });
  return canvas.toDataURL('image/png');
}
