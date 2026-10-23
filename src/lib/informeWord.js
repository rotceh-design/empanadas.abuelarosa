// Informe ejecutivo en Word (.docx) generado con el paquete `docx`.
// Incluye análisis del período, tablas, gráficos y recomendaciones accionables.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, ImageRun, PageBreak,
} from 'docx';
import { graficoLinea, graficoBarras, graficoDona } from './graficos';

const fmtCLP = (n) => {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
  } catch { return `$${Math.round(n || 0).toLocaleString('es-CL')}`; }
};

const fechaLarga = (iso) => new Date(iso).toLocaleDateString('es-CL', {
  day: 'numeric', month: 'long', year: 'numeric',
});

function p(texto, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.centro ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({ text: texto, ...opts.run })],
  });
}

function titulo(texto, nivel = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: nivel, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: texto })] });
}

function vineta(texto) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun(texto)],
  });
}

function tabla(headers, filas, anchosPct = null) {
  const gr = (t, bold = false) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(t ?? ''), bold, size: 18 })] })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: anchosPct || undefined,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h) => gr(h, true)),
      }),
      ...filas.map((f) => new TableRow({ children: f.map((c) => gr(c)) })),
    ],
  });
}

function uint8DeDataUrl(dataUrl) {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function imagen(dataUrl, ancho, alto) {
  if (!dataUrl) return null;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [new ImageRun({ data: uint8DeDataUrl(dataUrl), transformation: { width: ancho, height: alto } })],
  });
}

function seccionResumen(r) {
  const k = kpis(r);
  const periodo = r.periodo?.etiqueta || '';
  return [
    titulo('1. Resumen ejecutivo'),
    p(`Durante ${periodo}, Empanadas Abuela Rosa procesó ${k.pedidos} pedidos (${k.pagados} pagados y ${k.pendientes} pendientes de pago), `
      + `vendiendo ${k.empanadasVendidas} empanadas y ${k.bebidasVendidas} bebidas por un total de ${fmtCLP(k.ventas)}. `
      + `El costo de materia prima fue ${fmtCLP(k.costo)}, dejando un margen bruto de ${fmtCLP(k.margen)} (${k.margenPct}%). `
      + `El ticket promedio fue de ${fmtCLP(k.ticketPromedio)} y participaron ${k.clientesUnicos} clientes distintos.`),
    tabla(
      ['Indicador', 'Valor'],
      [
        ['Pedidos totales', k.pedidos],
        ['Ventas totales', fmtCLP(k.ventas)],
        ['Costo de materia prima', fmtCLP(k.costo)],
        ['Margen bruto', `${fmtCLP(k.margen)} (${k.margenPct}%)`],
        ['Empanadas vendidas', k.empanadasVendidas],
        ['Ticket promedio', fmtCLP(k.ticketPromedio)],
        ['Clientes únicos', k.clientesUnicos],
        ['Delivery cobrado', fmtCLP(k.deliveryTotal)],
      ],
    ),
  ];
}

function kpis(r) { return r.kpis; }

function seccionComoFunciona() {
  return [
    titulo('2. Cómo funciona el negocio hoy'),
    p('El sistema opera en tres capas que deben entenderse para tomar buenas decisiones:'),
    vineta('Tienda web: el cliente elige línea (salada o dulce), arma su empanada paso a paso (proteína, queso, acompañamientos, extras), '
      + 'agrega bebidas y paga por WhatsApp con comprobante. Cada pedido queda guardado con número correlativo, cliente, entrega y totales.'),
    vineta('Panel de administración: los pedidos entran en tiempo real y se mueven por estados: Pendiente de pago → Pago confirmado → '
      + 'En preparación → En reparto → Entregado. Al confirmar el pago se descuenta stock de ingredientes automáticamente.'),
    vineta('Inventario y costos: cada ingrediente tiene precio por kilo y porción en gramos; el sistema calcula el costo real de cada empanada, '
      + 'su margen y alerta cuando el stock alcanza para pocas unidades.'),
    p('La ventaja de este modelo es que cada pedido deja datos: qué se vendió, a quién, dónde, cuándo y con qué margen. '
      + 'Este informe convierte esos datos en decisiones.'),
  ];
}

function seccionClientes(r) {
  const top = (r.topClientes || []).slice(0, 10);
  if (!top.length) return [titulo('3. Clientes'), p('Aún no hay pedidos registrados en este período.')];
  const k = kpis(r);
  const concentracion = k.ventas > 0
    ? Math.round((top.slice(0, 3).reduce((s, c) => s + c.gastado, 0) / k.ventas) * 100) : 0;
  return [
    titulo('3. Nuestros clientes'),
    p(`${k.clientesUnicos} clientes distintos compraron en el período. Los 3 más importantes concentran ${concentracion}% del total facturado. `
      + 'Conocer a los clientes habituales permite tratarlos mejor (prioridad en producción,Delivery sin costo, obsequios puntuales) '
      + 'y detectar a los que llevan tiempo sin volver.'),
    tabla(
      ['Cliente', 'Comuna', 'Pedidos', 'Total gastado', 'Ticket prom.', 'Última compra'],
      top.map((c) => [
        c.nombre, c.comuna, c.pedidos, fmtCLP(c.gastado), fmtCLP(c.ticketProm),
        c.ultima ? fechaLarga(c.ultima) : '—',
      ]),
    ),
    ...(r.porComuna?.length ? [
      p(''),
      titulo('Zonas de mayor demanda', HeadingLevel.HEADING_2),
      tabla(['Comuna', 'Pedidos', 'Gastado'], r.porComuna.slice(0, 8).map((c) => [c.comuna, c.pedidos, fmtCLP(c.gastado)])),
    ] : []),
  ];
}

function seccionProductos(r, incluirGrafico = true) {
  const top = (r.topProductos || []).slice(0, 10);
  if (!top.length) return [titulo('4. Productos más vendidos'), p('Sin ventas en el período.')];
  const imgProd = incluirGrafico
    ? graficoBarras(
      top.slice(0, 8).map((x) => ({ etiqueta: x.nombre.split(' + ')[0], valor: x.empanadas })),
      { titulo: 'Productos más vendidos (unidades)' },
    ) : null;
  return [
    titulo('4. Productos más vendidos'),
    p('Estas son las combinaciones que sostienen las ventas. Si un producto es muy pedido pero tiene poco margen, '
      + 'un ajuste de precio o de porción ahí tiene el mayor efecto en la ganancia.'),
    tabla(
      ['Combinación', 'Empanadas', 'Ingresos', 'Costo', 'Margen', 'Margen %'],
      top.map((x) => [x.nombre, x.empanadas, fmtCLP(x.ventas), fmtCLP(x.costo), fmtCLP(x.margen), `${x.margenPct}%`]),
    ),
    ...(imgProd ? [p(''), imagen(imgProd, 560, 262)] : []),
    ...(r.topProteinas?.length ? [
      titulo('Preferencias', HeadingLevel.HEADING_2),
      p(`Proteínas favoritas: ${r.topProteinas.slice(0, 3).map((x) => `${x.nombre} (${x.veces})`).join(', ')}. `
        + `Quesos favoritos: ${(r.topQuesos || []).slice(0, 3).map((x) => `${x.nombre} (${x.veces})`).join(', ')}.`),
    ] : []),
  ];
}

function seccionCostos(r) {
  const porProducto = r.porProducto || [];
  const perdedores = porProducto.filter((x) => x.margen < 0);
  const bajos = porProducto.filter((x) => x.margen >= 0 && x.margenPct < 30).slice(0, 5);
  const costosTop = (r.ingredientes || []).slice(0, 8).filter((x) => x.costoTotal > 0);
  return [
    titulo('5. Costos y rentabilidad'),
    p(`En materia prima se gastó ${fmtCLP(r.kpis.costo)} para generar ${fmtCLP(r.kpis.ventas)} en ventas. `
      + 'La rentabilidad no depende solo de vender más, sino de vender bien: cada punto de margen recuperado '
      + 'se traduce directo en ganancia.'),
    ...(costosTop.length ? [
      titulo('Mayores costos de materia prima', HeadingLevel.HEADING_2),
      tabla(['Ingrediente', 'Consumo', 'Costo total'], costosTop.map((i) => [i.nombre, `${i.consumoGramos.toLocaleString('es-CL')} g`, fmtCLP(i.costoTotal)])),
    ] : []),
    ...(perdedores.length ? [
      titulo('¡Atención! Combinaciones que pierden dinero', HeadingLevel.HEADING_2),
      p('Estos productos se venden por debajo de su costo de ingredientes. Cada unidad vendida reduce la ganancia. '
        + 'Acción recomendada: subir precio, reducir porción o retirarlos del armador.'),
      tabla(['Combinación', 'Ingresos', 'Costo', 'Pérdida'], perdedores.map((x) => [x.nombre, fmtCLP(x.ventas), fmtCLP(x.costo), fmtCLP(-x.margen)])),
    ] : []),
    ...(bajos.length ? [
      titulo('Combinaciones con margen ajustado', HeadingLevel.HEADING_2),
      p('Venden bien pero dejan poco. Un aumento de $200 a $300 rara vez cambia la decisión del cliente y mejora la ganancia de inmediato.'),
      tabla(['Combinación', 'Margen %', 'Margen $'], bajos.map((x) => [x.nombre, `${x.margenPct}%`, fmtCLP(x.margen)])),
    ] : []),
  ];
}

function seccionMerma(r, incluirGrafico = true) {
  const ings = (r.ingredientes || []).filter((x) => x.costoTotal > 0).slice(0, 12);
  const imgDona = incluirGrafico && ings.length
    ? graficoDona(ings.slice(0, 6).map((x) => ({ etiqueta: x.nombre, valor: x.costoTotal })), { titulo: 'Costo de materia prima' }) : null;
  const bajos = ings.filter((x) => x.rendimiento !== null && x.rendimiento <= 10);
  return [
    titulo('6. Materia prima, stock y merma'),
    p('La merma es comida que se compra pero no se vende (quemada, mal armada, sobrante que se bota). '
      + 'Es la fuga de ganancia más silenciosa de un local de comida. Para controlarla se necesita una comparación simple:'),
    vineta('Cuánto material teórico usaste según los pedidos (esta sección del informe).'),
    vineta('Cuánto compraste en el período (registrar cada compra en Inventario).'),
    vineta('Cuánto queda realmente al final (conteo físico de stock).'),
    vineta('Merma = compras − uso teórico − stock contado. Si supera el 5% del costo de materia prima, hay un problema que investigar: '
      + 'porciones grandes de más, quemas frecuentes o hurtos.'),
    ...(ings.length ? [
      titulo('Consumo teórico del período', HeadingLevel.HEADING_2),
      tabla(['Ingrediente', 'Veces usado', 'Consumo', 'Costo', 'Stock actual', 'Alcanza para'], ings.map((i) => [
        i.nombre, i.vecesUsado, `${i.consumoGramos.toLocaleString('es-CL')} g`, fmtCLP(i.costoTotal),
        i.stockGramos != null ? `${i.stockGramos.toLocaleString('es-CL')} g` : '—',
        i.rendimiento != null ? `~${i.rendimiento} emp.` : '—',
      ])),
    ] : []),
    ...(imgDona ? [p(''), imagen(imgDona, 420, 300)] : []),
    ...(bajos.length ? [
      titulo('Stock crítico — reponer ya', HeadingLevel.HEADING_2),
      p(bajos.map((i) => `${i.nombre} (~${i.rendimiento} empanadas)`).join('; ')),
    ] : []),
  ];
}

function seccionActividad(r, incluirGrafico = true) {
  const imgLinea = incluirGrafico && r.porDia?.length
    ? graficoLinea(r.porDia.map((d) => ({ etiqueta: d.fecha.slice(5), valor: d.ventas })), { titulo: `Ventas diarias — ${r.periodo?.etiqueta || ''}` }) : null;
  const horas = (r.porHora || []).filter((h) => h.pedidos > 0).sort((a, b) => b.pedidos - a.pedidos).slice(0, 3);
  const dias = (r.porDiaSemana || []).filter((d) => d.pedidos > 0).sort((a, b) => b.pedidos - a.pedidos);
  return [
    titulo('7. Actividad y operación'),
    p('Cuándo y dónde ocurren los pedidos define cómo organizas compras, cocina y reparto.'),
    ...(imgLinea ? [imagen(imgLinea, 560, 262)] : []),
    ...(dias.length ? [tabla(['Día', 'Pedidos', 'Gastado'], dias.map((d) => [d.dia, d.pedidos, fmtCLP(d.gastado)]))] : []),
    ...(horas.length ? [p(`Horas punta: ${horas.map((h) => h.etiqueta).join(', ')}. Concentra ahí la capacidad de freidora y salidas de reparto.`)] : []),
  ];
}

function seccionConclusiones(r) {
  const insights = r.insights || [];
  const acciones = [
    'Definir un día de la semana con promo fija para levantar los días flojos.',
    'Revisar los precios de las combinaciones de margen bajo listadas en la sección de costos.',
    'Registrar todas las compras y bajas de inventario para empezar a medir merma real.',
    'Contactar por WhatsApp a los clientes que llevan más de 2 semanas sin pedir.',
    'Armar un pack "empanada + bebida" visible al final del armador para subir el ticket promedio.',
    'Negociar precio por volumen de los 3 ingredientes más caros del período.',
  ];
  return [
    titulo('8. Conclusiones y recomendaciones'),
    ...insights.map((ins) => vineta(`${ins.titulo}: ${ins.texto}`)),
    titulo('9. Plan de acción sugerido', HeadingLevel.HEADING_1),
    p('Seis pasos concretos para bajar costo y merma y subir ganancia:'),
    ...acciones.map((a, i) => vineta(`Paso ${i + 1}. ${a}`)),
    p(''),
    p('Este informe se genera automáticamente desde los pedidos reales del negocio. '
      + 'A medida que entren más pedidos, el análisis se vuelve más preciso: la recomendación es descargarlo cada mes '
      + 'y compararlo con el anterior para confirmar que las acciones funcionan.', { run: { italics: true } }),
  ];
}

export async function generarInformeWord(reporte, { incluirGraficos = true } = {}) {
  const periodo = reporte.periodo?.etiqueta || '';
  const portada = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2200, after: 200 }, children: [new TextRun({ text: 'EMPANADAS ABUELA ROSA', bold: true, size: 56, color: '4A2C17' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'INFORME EJECUTIVO', bold: true, size: 36, color: '8B4513' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: periodo.toUpperCase(), size: 28, color: '4A2C17' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Generado el ${fechaLarga(reporte.generadoEn)}`, italics: true, size: 20, color: '888888' })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const doc = new Document({
    creator: 'Empanadas Abuela Rosa',
    title: `Informe ejecutivo ${periodo}`,
    sections: [{
      properties: {},
      children: [
        ...portada,
        ...seccionResumen(reporte),
        ...seccionComoFunciona(),
        ...seccionClientes(reporte),
        ...seccionProductos(reporte, incluirGraficos),
        ...seccionCostos(reporte),
        ...seccionMerma(reporte, incluirGraficos),
        ...seccionActividad(reporte, incluirGraficos),
        ...seccionConclusiones(reporte),
      ],
    }],
  });

  if (typeof document !== 'undefined') {
    return Packer.toBlob(doc);
  }
  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
