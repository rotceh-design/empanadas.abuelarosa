import fs from 'node:fs';
import { createCanvas, Image as CanvasImage } from 'canvas';

class Imagen extends CanvasImage {
  set src(v) {
    let ruta = v;
    if (typeof v === 'string' && v.startsWith('/')) ruta = `${process.cwd()}${v}`;
    this._ruta = ruta;
    fs.readFile(ruta, (err, buf) => {
      if (err) { this.onerror?.(new Error(`no se pudo leer ${ruta}`)); return; }
      super.src = buf;
      this.onload?.();
    });
  }
  get src() { return this._ruta; }
}

globalThis.Image = Imagen;
globalThis.document = {
  createElement(tag) {
    if (tag === 'canvas') return createCanvas(1, 1);
    throw new Error(`elemento no soportado: ${tag}`);
  },
  fonts: { load: async () => [] },
};

const { generarImagenTicket } = await import('../src/lib/comprobanteImagen.js');

const pedido = {
  numero: 17,
  createdAt: Date.now(),
  items: [
    {
      tipo: 'empanada',
      nombre: 'Camarón Cocido c/ Dos Quesos',
      cantidad: 2,
      proteina: 'Camarón cocido',
      queso: 'Gouda + Mantequilla',
      acompanamientos: ['Champiñón', 'Pimentón', 'Aceituna', 'Acelga'],
      extrasCount: 1,
      etiquetas: ['marisco', 'picante'],
      precioUnitario: 3565,
      esDelDia: true,
    },
    {
      tipo: 'empanada',
      nombre: 'Pollo c/ Queso',
      cantidad: 1,
      proteina: 'Pollo',
      queso: 'Mozzarella',
      acompanamientos: ['Choclo'],
      extrasCount: 0,
      etiquetas: [],
      precioUnitario: 3490,
    },
    { tipo: 'bebida', nombre: 'Coca-Cola 350ml', cantidad: 1, precio: 1700 },
  ],
  oferta: { ahorro: 400, detalle: ['Empanadas del día + bebida'] },
  totales: { subtotal: 12255, ahorro: 400, delivery: 1000, total: 12855 },
  cliente: {
    nombre: 'Rocío Hernández Quiroz',
    telefono: '+56 9 8765 4321',
    direccion: 'Av. 5 de Abril 1234, casa color crema con portón verde al fondo',
    comuna: 'Maipú',
    referencias: 'Timbre 2, dejar con la vecina si no hay nadie',
  },
  entrega: { fecha: 'Sábado 18 de octubre', hora: '13:00 - 14:00' },
};

const dataUrl = await generarImagenTicket(pedido, { whatsapp: '56935438480' });
fs.writeFileSync('tmp_ticket_preview.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('OK tmp_ticket_preview.png', Math.round(dataUrl.length / 1024), 'KB (dataURL)');
