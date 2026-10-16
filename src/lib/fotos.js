// Utilidades de imagen en el navegador: compresión con canvas y
// compartir archivos vía Web Share API (WhatsApp nativo) con fallbacks.

export async function comprimirImagen(file, { maxLado = 1000, calidad = 0.78, formato = 'image/webp' } = {}) {
  const img = await cargarImagen(file);
  const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  if (img.src?.startsWith?.('blob:')) URL.revokeObjectURL(img.src);

  let dataUrl = canvas.toDataURL(formato, calidad);
  if (!dataUrl.startsWith(`data:${formato}`)) dataUrl = canvas.toDataURL('image/jpeg', calidad);
  const blob = await (await fetch(dataUrl)).blob();
  const ext = dataUrl.startsWith('data:image/webp') ? 'webp' : 'jpg';
  const nombre = (file.name || 'foto').replace(/\.\w+$/, '');
  const archivo = new File([blob], `${nombre}.${ext}`, { type: blob.type });

  return { dataUrl, blob, archivo, bytes: blob.size, alto: h, ancho: w };
}

function cargarImagen(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => cargarImagenConImg(file));
  }
  return cargarImagenConImg(file);
}

function cargarImagenConImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ ...img, width: img.naturalWidth, height: img.naturalHeight, src: url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

// Comparte texto + archivo. Devuelve: 'compartido' | 'copiado' | 'cancelado' | 'error'
export async function compartirConArchivo({ texto, titulo = 'Mi pedido', archivo = null, url = '' }) {
  const conUrl = url ? `${texto}\n${url}` : texto;
  try {
    if (archivo && navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], text: texto, title: titulo });
      return 'compartido';
    }
    if (navigator.share) {
      await navigator.share({ text: conUrl, title: titulo });
      return 'compartido';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelado';
  }
  try {
    await navigator.clipboard.writeText(conUrl);
    return 'copiado';
  } catch {
    return 'error';
  }
}
