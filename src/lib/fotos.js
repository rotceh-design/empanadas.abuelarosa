// Utilidades de imagen en el navegador: compresión con canvas y
// compartir archivos vía Web Share API (WhatsApp nativo) con fallbacks.

// Comprime y, si `maxKB` está definido, itera hasta quedar bajo ese peso:
// primero baja la calidad y, si no alcanza, reduzce también el tamaño.
export async function comprimirImagen(file, { maxLado = 1000, calidad = 0.78, formato = 'image/webp', maxKB = 0 } = {}) {
  if (/^image\/(heic|heif)/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name || '')) {
    throw new Error('Formato HEIC no compatible. Convierte la foto a JPG o PNG.');
  }
  const img = await cargarImagen(file);
  const anchoImg = img.naturalWidth || img.width;
  const altoImg = img.naturalHeight || img.height;
  const escala = Math.min(1, maxLado / Math.max(anchoImg, altoImg));
  let w = Math.round(anchoImg * escala);
  let h = Math.round(altoImg * escala);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const codificar = (q) => {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    let dataUrl = canvas.toDataURL(formato, q);
    if (!dataUrl.startsWith(`data:${formato}`)) dataUrl = canvas.toDataURL('image/jpeg', q);
    return dataUrl;
  };

  let calidadActual = calidad;
  let dataUrl = codificar(calidadActual);
  let blob = await (await fetch(dataUrl)).blob();

  if (maxKB > 0) {
    const tope = maxKB * 1024;
    let reduccionesTam = 0;
    while (blob.size > tope && reduccionesTam < 3) {
      if (calidadActual > 0.35) {
        calidadActual = Math.max(0.35, calidadActual - 0.1);
      } else {
        w = Math.round(w * 0.75);
        h = Math.round(h * 0.75);
        reduccionesTam += 1;
      }
      dataUrl = codificar(calidadActual);
      blob = await (await fetch(dataUrl)).blob();
    }
  }

  if (img.src?.startsWith?.('blob:')) URL.revokeObjectURL(img.src);

  const ext = dataUrl.startsWith('data:image/webp') ? 'webp' : 'jpg';
  const nombre = (file.name || 'foto').replace(/\.\w+$/, '');
  const archivo = new File([blob], `${nombre}.${ext}`, { type: blob.type });

  return { dataUrl, blob, archivo, bytes: blob.size, alto: h, ancho: w };
}

function cargarImagen(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch((e1) => cargarImagenConImg(file, e1));
  }
  return cargarImagenConImg(file);
}

function cargarImagenConImg(file, errorPrevio = null) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp|avif|svg)$/i.test(file?.name || '')) {
      reject(new Error(`El archivo "${file?.name || 'desconocido'}" no es una imagen válida`));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const detalle = errorPrevio?.message ? ` (${errorPrevio.message})` : '';
      reject(new Error(`No se pudo leer la imagen${detalle}. Usa JPG, PNG o WebP.`));
    };
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
