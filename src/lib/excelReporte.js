// Generación del Excel de reporte (múltiples hojas + gráficos PNG en canvas).
// exceljs corre en navegador y en node; los gráficos solo en navegador.
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { graficoLinea, graficoBarras, graficoDona } from './graficos';

const MARRON = 'FF4A2C17';
const CREMA = 'FFF3E6C8';
const VERDE = 'FF4E9A51';
const BERMELLON = 'FFB5402F';
const CLP = '"$"#,##0';

function encabezado(ws, fila, columnas) {
  const f = ws.getRow(fila);
  columnas.forEach((c, i) => {
    const celda = f.getCell(i + 1);
    celda.value = c;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MARRON } };
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  f.height = 22;
  ws.views = [{ state: 'frozen', ySplit: fila }];
}

function bordes(ws, desdeFila, hastaFila, numCol) {
  for (let r = desdeFila; r <= hastaFila; r++) {
    for (let c = 1; c <= numCol; c++) {
      ws.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: 'FF4A2C1755' } },
        bottom: { style: 'thin', color: { argb: 'FF4A2C1755' } },
        left: { style: 'thin', color: { argb: 'FF4A2C1755' } },
        right: { style: 'thin', color: { argb: 'FF4A2C1755' } },
      };
    }
  }
}

function tituloSeccion(ws, fila, texto, anchoCol = 1) {
  const celda = ws.getCell(fila, 1);
  celda.value = texto;
  celda.font = { bold: true, size: 13, color: { argb: MARRON } };
  celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREMA } };
  if (anchoCol > 1) ws.mergeCells(fila, 1, fila, anchoCol);
  return fila + 1;
}

function anchos(ws, lista) {
  ws.columns = lista.map((w) => ({ width: w }));
}

function base64DeDataUrl(dataUrl) {
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

function embeberGrafico(wb, ws, dataUrl, fila, anchoPx, altoPx) {
  if (!dataUrl) return;
  const id = wb.addImage({ base64: base64DeDataUrl(dataUrl), extension: 'png' });
  ws.addImage(id, { tl: { col: 0.4, row: fila - 0.2 }, ext: { width: anchoPx, height: altoPx } });
}

const fechaCorta = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ============ Hoja Resumen ============
function hojaResumen(wb, reporte) {
  const ws = wb.addWorksheet('Resumen', { properties: { tabColor: { argb: MARRON } } });
  anchos(ws, [28, 18, 18, 18, 18, 18, 18]);
  const periodo = reporte.periodo?.etiqueta || '';
  const k = reporte.kpis;
  ws.mergeCells('A1:G1');
  const t = ws.getCell('A1');
  t.value = `EMPANADAS ABUELA ROSA — REPORTE ${periodo.toUpperCase()}`;
  t.font = { bold: true, size: 16, color: { argb: MARRON } };
  t.alignment = { horizontal: 'center' };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREMA } };
  ws.getRow(1).height = 30;
  ws.mergeCells('A2:G2');
  ws.getCell('A2').value = `Generado el ${new Date(reporte.generadoEn).toLocaleString('es-CL')}`;
  ws.getCell('A2').font = { italic: true, size: 9, color: { argb: 'FF888888' } };

  let fila = tituloSeccion(ws, 4, 'Indicadores clave', 4);
  encabezado(ws, fila, ['Indicador', 'Valor', 'Indicador', 'Valor']);
  fila += 1;
  const esPlata = (nom) => /ventas|margen bruto|costo|ticket|delivery|descuentos/i.test(nom);
  const pares = [
    ['Pedidos totales', k.pedidos, 'Pedidos pagados', k.pagados],
    ['Pendientes de pago', k.pendientes, 'Clientes únicos', k.clientesUnicos],
    ['Ventas totales', k.ventas, 'Costo materia prima', k.costo],
    ['Margen bruto', k.margen, 'Margen %', k.margenPct],
    ['Empanadas vendidas', k.empanadasVendidas, 'Bebidas vendidas', k.bebidasVendidas],
    ['Ticket promedio', k.ticketPromedio, 'Empanadas por pedido', k.empanadasPorPedido],
    ['Delivery cobrado', k.deliveryTotal, 'Descuentos otorgados', k.ahorroTotal],
    ['Ventas por día activo', k.ventasPorDia, 'Días con ventas', k.diasActivos],
  ];
  pares.forEach((par) => {
    ws.getCell(fila, 1).value = par[0];
    ws.getCell(fila, 2).value = par[1];
    if (typeof par[1] === 'number' && esPlata(par[0])) ws.getCell(fila, 2).numFmt = CLP;
    if (!Number.isInteger(par[1])) ws.getCell(fila, 2).numFmt = '0.0';
    ws.getCell(fila, 3).value = par[2];
    ws.getCell(fila, 4).value = par[3];
    if (typeof par[3] === 'number' && esPlata(par[2])) ws.getCell(fila, 4).numFmt = CLP;
    fila += 1;
  });
  bordes(ws, fila - pares.length, fila - 1, 4);

  fila += 1;
  fila = tituloSeccion(ws, fila, 'Conclusiones automáticas', 7);
  encabezado(ws, fila, ['#', 'Hallazgo', 'Detalle', '', '', '', '']);
  fila += 1;
  (reporte.insights || []).forEach((ins, i) => {
    ws.getCell(fila, 1).value = i + 1;
    ws.getCell(fila, 2).value = ins.titulo;
    ws.mergeCells(fila, 3, fila, 7);
    ws.getCell(fila, 3).value = ins.texto;
    ws.getCell(fila, 3).alignment = { wrapText: true, vertical: 'top' };
    if (ins.nivel === 'alerta') ws.getCell(fila, 2).font = { bold: true, color: { argb: BERMELLON } };
    else if (ins.nivel === 'ok') ws.getCell(fila, 2).font = { bold: true, color: { argb: VERDE } };
    else ws.getCell(fila, 2).font = { bold: true };
    ws.getRow(fila).height = 32;
    fila += 1;
  });

  fila += 1;
  fila = tituloSeccion(ws, fila, 'Gráficos del período', 7);
  const imgVentas = graficoLinea(
    reporte.porDia.map((d) => ({ etiqueta: d.fecha.slice(5), valor: d.ventas })),
    { titulo: `Ventas diarias — ${periodo}` },
  );
  const imgProd = graficoBarras(
    (reporte.topProductos || []).slice(0, 8).map((p) => ({ etiqueta: p.nombre.split(' + ')[0], valor: p.empanadas })),
    { titulo: 'Top productos (empanadas vendidas)' },
  );
  const imgComuna = graficoDona(
    (reporte.porComuna || []).slice(0, 7).map((c) => ({ etiqueta: c.comuna, valor: c.pedidos })),
    { titulo: 'Pedidos por comuna' },
  );
  embeberGrafico(wb, ws, imgVentas, fila, 640, 300);
  embeberGrafico(wb, ws, imgProd, fila + 17, 640, 300);
  embeberGrafico(wb, ws, imgComuna, fila + 34, 420, 300);
  return ws;
}

// ============ Hoja Ventas diarias ============
function hojaDiaria(wb, reporte) {
  const ws = wb.addWorksheet('Ventas diarias', { properties: { tabColor: { argb: 'FFB5763A' } } });
  anchos(ws, [14, 10, 12, 10, 14, 14, 14, 10]);
  encabezado(ws, 1, ['Fecha', 'Pedidos', 'Empanadas', 'Bebidas', 'Ventas', 'Costo', 'Margen', 'Margen %']);
  let fila = 2;
  (reporte.porDia || []).forEach((d) => {
    ws.getCell(fila, 1).value = d.fecha;
    ws.getCell(fila, 2).value = d.pedidos || 0;
    ws.getCell(fila, 3).value = d.empanadas || 0;
    ws.getCell(fila, 4).value = d.bebidas || 0;
    ws.getCell(fila, 5).value = d.ventas;
    ws.getCell(fila, 5).numFmt = CLP;
    ws.getCell(fila, 6).value = d.costo;
    ws.getCell(fila, 6).numFmt = CLP;
    ws.getCell(fila, 7).value = d.margen;
    ws.getCell(fila, 7).numFmt = CLP;
    ws.getCell(fila, 8).value = d.ventas > 0 ? Math.round((d.margen / d.ventas) * 100) : 0;
    fila += 1;
  });
  // Totales
  if (fila > 2) {
    ws.getCell(fila, 1).value = 'TOTAL';
    ws.getCell(fila, 1).font = { bold: true };
    [2, 3, 4, 5, 6, 7].forEach((c) => {
      ws.getCell(fila, c).value = { formula: `SUM(${ws.getColumn(c).letter}2:${ws.getColumn(c).letter}${fila - 1})` };
      if (c >= 5) ws.getCell(fila, c).numFmt = CLP;
      ws.getCell(fila, c).font = { bold: true };
      ws.getCell(fila, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREMA } };
    });
  }
  bordes(ws, 2, fila, 8);
  if (fila > 3) {
    ws.addConditionalFormatting({
      ref: `E2:E${fila - 1}`,
      rules: [{ type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FFB5763A' } }],
    });
  }
  return ws;
}

// ============ Hoja Productos ============
function hojaProductos(wb, reporte) {
  const ws = wb.addWorksheet('Productos', { properties: { tabColor: { argb: 'FF4E9A51' } } });
  anchos(ws, [34, 14, 14, 26, 9, 11, 13, 13, 13, 9]);
  encabezado(ws, 1, ['Combinación', 'Proteína', 'Queso', 'Acompañamientos', 'Pedidos', 'Empanadas', 'Ingresos', 'Costo', 'Margen', 'Margen %']);
  let fila = 2;
  (reporte.porProducto || []).forEach((p) => {
    ws.getCell(fila, 1).value = p.nombre;
    ws.getCell(fila, 2).value = p.proteina;
    ws.getCell(fila, 3).value = p.queso;
    ws.getCell(fila, 4).value = (p.acompanamientos || []).join(', ');
    ws.getCell(fila, 5).value = p.veces;
    ws.getCell(fila, 6).value = p.empanadas;
    ws.getCell(fila, 7).value = p.ventas;
    ws.getCell(fila, 7).numFmt = CLP;
    ws.getCell(fila, 8).value = p.costo;
    ws.getCell(fila, 8).numFmt = CLP;
    ws.getCell(fila, 9).value = p.margen;
    ws.getCell(fila, 9).numFmt = CLP;
    ws.getCell(fila, 10).value = p.margenPct;
    if (p.margen < 0) ws.getCell(fila, 9).font = { bold: true, color: { argb: BERMELLON } };
    fila += 1;
  });
  fila += 1;
  fila = tituloSeccion(ws, fila, 'Ranking de ingredientes (frecuencia en lo vendido)', 4);
  encabezado(ws, fila, ['Proteína', 'Empanadas', 'Queso', 'Empanadas']);
  fila += 1;
  const maxFilas = Math.max(reporte.topProteinas?.length || 0, reporte.topQuesos?.length || 0);
  for (let i = 0; i < maxFilas; i++) {
    const pr = reporte.topProteinas?.[i];
    const qu = reporte.topQuesos?.[i];
    ws.getCell(fila, 1).value = pr?.nombre || '';
    ws.getCell(fila, 2).value = pr?.veces || '';
    ws.getCell(fila, 3).value = qu?.nombre || '';
    ws.getCell(fila, 4).value = qu?.veces || '';
    fila += 1;
  }
  fila = tituloSeccion(ws, fila + 1, 'Acompañamientos más pedidos', 2);
  encabezado(ws, fila, ['Acompañamiento', 'Veces en pedidos']);
  fila += 1;
  (reporte.topAcompanamientos || []).slice(0, 15).forEach((a) => {
    ws.getCell(fila, 1).value = a.nombre;
    ws.getCell(fila, 2).value = a.veces;
    fila += 1;
  });
  if ((reporte.porBebidas || []).length > 0) {
    fila = tituloSeccion(ws, fila + 1, 'Bebidas', 5);
    encabezado(ws, fila, ['Bebida', 'Unidades', 'Ingresos', 'Costo', 'Margen']);
    fila += 1;
    reporte.porBebidas.forEach((b) => {
      ws.getCell(fila, 1).value = b.nombre;
      ws.getCell(fila, 2).value = b.unidades;
      ws.getCell(fila, 3).value = b.ventas;
      ws.getCell(fila, 3).numFmt = CLP;
      ws.getCell(fila, 4).value = b.costo;
      ws.getCell(fila, 4).numFmt = CLP;
      ws.getCell(fila, 5).value = b.margen;
      ws.getCell(fila, 5).numFmt = CLP;
      fila += 1;
    });
  }
  return ws;
}

// ============ Hoja Clientes ============
function hojaClientes(wb, reporte) {
  const ws = wb.addWorksheet('Clientes', { properties: { tabColor: { argb: 'FF5B8CB8' } } });
  anchos(ws, [24, 14, 16, 9, 14, 14, 14, 14]);
  encabezado(ws, 1, ['Cliente', 'Teléfono', 'Comuna', 'Pedidos', 'Total gastado', 'Ticket prom.', 'Última compra', 'Días desde']);
  let fila = 2;
  const hoy = Date.now();
  (reporte.porCliente || []).forEach((c) => {
    ws.getCell(fila, 1).value = c.nombre;
    ws.getCell(fila, 2).value = c.telefono;
    ws.getCell(fila, 3).value = c.comuna;
    ws.getCell(fila, 4).value = c.pedidos;
    ws.getCell(fila, 5).value = c.gastado;
    ws.getCell(fila, 5).numFmt = CLP;
    ws.getCell(fila, 6).value = c.ticketProm;
    ws.getCell(fila, 6).numFmt = CLP;
    ws.getCell(fila, 7).value = fechaCorta(c.ultima);
    ws.getCell(fila, 8).value = c.ultima ? Math.max(0, Math.round((hoy - Date.parse(c.ultima)) / 864e5)) : '';
    fila += 1;
  });
  bordes(ws, 2, Math.max(2, fila - 1), 8);
  if (fila > 3) {
    ws.addConditionalFormatting({
      ref: `E2:E${fila - 1}`,
      rules: [{ type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF5B8CB8' } }],
    });
  }
  return ws;
}

// ============ Hoja Ingredientes y merma ============
function hojaIngredientes(wb, reporte) {
  const ws = wb.addWorksheet('Ingredientes', { properties: { tabColor: { argb: 'FFB5402F' } } });
  anchos(ws, [22, 12, 11, 13, 13, 11, 11, 12, 12]);
  encabezado(ws, 1, ['Ingrediente', 'Categoría', 'Usos', 'Consumo (g)', 'Costo total', '$/kg', 'Porción (g)', 'Stock (g)', 'Rendimiento']);
  let fila = 2;
  (reporte.ingredientes || []).forEach((i) => {
    ws.getCell(fila, 1).value = i.nombre;
    ws.getCell(fila, 2).value = i.categoria;
    ws.getCell(fila, 3).value = i.vecesUsado;
    ws.getCell(fila, 4).value = i.consumoGramos;
    ws.getCell(fila, 5).value = i.costoTotal;
    ws.getCell(fila, 5).numFmt = CLP;
    ws.getCell(fila, 6).value = i.costoKg;
    ws.getCell(fila, 6).numFmt = CLP;
    ws.getCell(fila, 7).value = i.porcionGramos;
    ws.getCell(fila, 8).value = i.stockGramos ?? '—';
    ws.getCell(fila, 9).value = i.rendimiento ?? '—';
    if (i.rendimiento !== null && i.rendimiento <= 10) {
      ws.getCell(fila, 9).font = { bold: true, color: { argb: BERMELLON } };
    }
    fila += 1;
  });
  bordes(ws, 2, Math.max(2, fila - 1), 9);
  fila += 1;
  ws.mergeCells(fila, 1, fila, 9);
  ws.getCell(fila, 1).value = 'MERMA: registra en Inventario cada compra y cada baja real. Merma = compras − consumo teórico de esta hoja − stock contado. Meta: <5% del costo de materia prima.';
  ws.getCell(fila, 1).font = { italic: true, size: 9, color: { argb: MARRON } };
  ws.getCell(fila, 1).alignment = { wrapText: true };
  ws.getRow(fila).height = 28;
  if (reporte.masaGramosTotal > 0) {
    fila += 2;
    ws.getCell(fila, 1).value = 'Masa total consumida (g)';
    ws.getCell(fila, 1).font = { bold: true };
    ws.getCell(fila, 2).value = reporte.masaGramosTotal;
  }
  return ws;
}

// ============ Hoja Actividad ============
function hojaActividad(wb, reporte) {
  const ws = wb.addWorksheet('Actividad', { properties: { tabColor: { argb: 'FF7A5C2E' } } });
  anchos(ws, [16, 11, 14, 4, 12, 11, 14, 4, 10, 12]);
  let fila = tituloSeccion(ws, 1, 'Pedidos por comuna', 3);
  encabezado(ws, fila, ['Comuna', 'Pedidos', 'Gastado']);
  fila += 1;
  (reporte.porComuna || []).forEach((c) => {
    ws.getCell(fila, 1).value = c.comuna;
    ws.getCell(fila, 2).value = c.pedidos;
    ws.getCell(fila, 3).value = c.gastado;
    ws.getCell(fila, 3).numFmt = CLP;
    fila += 1;
  });
  fila = tituloSeccion(ws, fila + 1, 'Pedidos por día de la semana', 3);
  encabezado(ws, fila, ['Día', 'Pedidos', 'Gastado']);
  fila += 1;
  (reporte.porDiaSemana || []).forEach((d) => {
    ws.getCell(fila, 1).value = d.dia;
    ws.getCell(fila, 2).value = d.pedidos;
    ws.getCell(fila, 3).value = d.gastado;
    ws.getCell(fila, 3).numFmt = CLP;
    fila += 1;
  });
  fila = tituloSeccion(ws, fila + 1, 'Pedidos por hora', 2);
  encabezado(ws, fila, ['Hora', 'Pedidos']);
  fila += 1;
  const horaIni = fila;
  (reporte.porHora || []).forEach((h) => {
    ws.getCell(fila, 1).value = h.etiqueta;
    ws.getCell(fila, 2).value = h.pedidos;
    fila += 1;
  });
  if (fila - horaIni > 2) {
    ws.addConditionalFormatting({
      ref: `B${horaIni}:B${fila - 1}`,
      rules: [{ type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF7A5C2E' } }],
    });
  }
  fila = tituloSeccion(ws, fila + 1, 'Estados de los pedidos del período', 2);
  encabezado(ws, fila, ['Estado', 'Pedidos']);
  fila += 1;
  Object.entries(reporte.estados || {}).forEach(([estado, n]) => {
    ws.getCell(fila, 1).value = estado;
    ws.getCell(fila, 2).value = n;
    fila += 1;
  });
  return ws;
}

// Genera el workbook completo y lo devuelve como Blob listo para descargar.
export async function generarExcelReporte(reporte) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Empanadas Abuela Rosa';
  wb.created = new Date();
  hojaResumen(wb, reporte);
  hojaDiaria(wb, reporte);
  hojaProductos(wb, reporte);
  hojaClientes(wb, reporte);
  hojaIngredientes(wb, reporte);
  hojaActividad(wb, reporte);
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function nombreArchivoReporte(periodo, ext) {
  const base = `abuela-rosa-reporte-${periodo?.corto || 'periodo'}`;
  return `${base}.${ext}`;
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
