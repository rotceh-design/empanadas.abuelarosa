// Prueba del motor de ofertas y etiquetas (corre con node, sin dependencias).
import { calcularMejorOferta } from '../src/lib/ofertas.js';
import { CATALOGO_SEED, OFERTAS_SEED } from '../src/data/catalogoSeed.js';
import {
  construirReporte, periodoRango, periodoAnterior, periodosDisponibles,
} from '../src/lib/reportes.js';
import { generarExcelReporte, nombreArchivoReporte } from '../src/lib/excelReporte.js';
import { generarInformeWord } from '../src/lib/informeWord.js';
import { BEBIDAS_SEED } from '../src/data/catalogoSeed.js';

let fallos = 0;
const emp = (precio = 0) => ({ precioUnitario: precio, extrasPrecio: precio, cantidad: 1 });
const calc = (nEmp, nBeb, extras = 0) =>
  calcularMejorOferta({
    empanadas: Array.from({ length: nEmp }, () => emp(extras)),
    bebidas: Array.from({ length: nBeb }, (_, i) => ({ cantidad: 1, precio: 1700, cartId: i })),
    ofertas: OFERTAS_SEED,
    precioBase: 2990,
    precioBebida: 1700,
  }).total;

function ok(nombre, obtenido, esperado) {
  const pasa = obtenido === esperado;
  if (!pasa) fallos++;
  console.log(`${pasa ? '✓' : '✗'} ${nombre}: ${obtenido}${pasa ? '' : ` (esperado ${esperado})`}`);
}

function si(nombre, condicion) {
  ok(nombre, condicion ? 'si' : 'no', 'si');
}

ok('1 empanada', calc(1, 0), 2990);
ok('2 empanadas', calc(2, 0), 5590);
ok('1 emp + 1 lata', calc(1, 1), 4390);
ok('2 emp + 2 latas', calc(2, 2), 8190);
ok('1 emp + 2 latas (1 lata suelta)', calc(1, 2), 4390 + 1700);
ok('3 empanadas (2 + 1)', calc(3, 0), 5590 + 2990);
ok('extras se suman encima del bundle', calc(1, 0, 1500), 2990 + 1500);
ok('combo familiar (6 emp + 4 latas)', calc(6, 4), 20990);

// Empanadas del día: precio especial, NO participan en bundles
const empDelDia = [{ precioUnitario: 2990, extrasPrecio: 2990 - 2990, cantidad: 1, esDelDia: true }];
ok('empanada del día cuesta 2990', calcularMejorOferta({
  empanadas: empDelDia, bebidas: [], ofertas: OFERTAS_SEED, precioBase: 2990, precioBebida: 1700,
}).total, 2990);
ok('del día NO entra al bundle (2990 + premium 3490)', calcularMejorOferta({
  empanadas: [...empDelDia, { precioUnitario: 3490, extrasPrecio: 3490 - 2990, cantidad: 1 }],
  bebidas: [], ofertas: OFERTAS_SEED, precioBase: 2990, precioBebida: 1700,
}).total, 6480);

// Promo del día: −$200 al total con ≥1 empanada del día + ≥1 bebida
const diaFlag = { precioUnitario: 2990, extrasPrecio: 0, cantidad: 1, esDelDia: true };
const sinFlag = { precioUnitario: 2990, extrasPrecio: 0, cantidad: 1 };
const calcP = (empanadas, bebidas) =>
  calcularMejorOferta({ empanadas, bebidas, ofertas: OFERTAS_SEED, precioBase: 2990, precioBebida: 1700 });
ok('día + bebida aplica −200 (sin combo por del día)', calcP([diaFlag], [{ cantidad: 1 }]).total, 4490);
ok('día + bebida ahorra solo la promo 200', calcP([diaFlag], [{ cantidad: 1 }]).ahorro, 200);
ok('día sola NO aplica promo', calcP([diaFlag], []).total, 2990);
ok('sin día + bebida NO aplica promo', calcP([sinFlag], [{ cantidad: 1 }]).total, 4390);
ok('promo aplica UNA vez con 2 días + 2 bebidas', calcP([diaFlag, { ...diaFlag }], [{ cantidad: 2 }]).total, 9380 - 200);
ok('2 del día no reciben bundle', calcP([diaFlag, { ...diaFlag }], []).total, 5980);
ok('mixto: bundle solo sobre las normales', calcP([diaFlag, sinFlag, { ...sinFlag }], []).total, 5590 + 2990);

// Etiquetas
import { calcularEtiquetas } from '../src/lib/etiquetas.js';
const porId = Object.fromEntries(CATALOGO_SEED.map((i) => [i.id, i]));
const vegana = calcularEtiquetas({
  proteina: porId.p_seitan, queso: porId.q_vegano,
  acompanamientos: [porId.a_tomate, porId.a_espinaca, porId.a_acelga, porId.a_choclo],
});
ok('etiqueta vegana detectada', vegana.esVegana ? 'si' : 'no', 'si');

const mar = calcularEtiquetas({
  proteina: porId.p_camaron, queso: porId.q_gouda,
  acompanamientos: [porId.a_tomate, porId.a_espinaca, porId.a_acelga, porId.a_choclo],
});
ok('etiqueta marisco detectada', mar.etiquetas.some((e) => e.id === 'marisco') ? 'si' : 'no', 'si');

// Combinaciones: 6 proteínas × 4 quesos × C(11,4)
import { totalCombinaciones } from '../src/lib/nombres.js';
const salada = {
  proteinas: CATALOGO_SEED.filter((i) => i.categoria === 'proteina' && i.linea === 'salada'),
  quesos: CATALOGO_SEED.filter((i) => i.categoria === 'queso' && i.linea === 'salada'),
  acompanamientos: CATALOGO_SEED.filter((i) => i.categoria === 'acompanamiento' && i.linea === 'salada'),
  cantidadAcompanamientos: 4,
};
ok('total combinaciones = 7920', totalCombinaciones(salada), 7920);

// Precio por ingredientes con rango [3490, 3990]
import { precioEmpanada, extrasAgregados } from '../src/lib/precios.js';
const settings = { precios: SETTINGS_SEED.precios };
const minCombo = precioEmpanada({
  proteina: porId.p_pollo, queso: porId.q_vegano,
  acompanamientos: [porId.a_tomate, porId.a_champinon, porId.a_acelga, porId.a_zapallo],
}, settings);
ok('empanada más simple = 3490', minCombo, 3490);
const maxCombo = precioEmpanada({
  proteina: porId.p_salmon, queso: porId.q_gouda,
  acompanamientos: [porId.a_aceituna, porId.a_palmitos, porId.a_albahaca, porId.a_pimenton],
}, settings);
ok('empanada premium ≤ 3990', maxCombo <= 3990 ? maxCombo : 'sobre tope', maxCombo);
const cara = precioEmpanada({
  proteina: { id: 'x', categoria: 'proteina', precio: 9999 }, queso: porId.q_gouda,
  acompanamientos: [porId.a_aceituna, porId.a_palmitos, porId.a_albahaca, porId.a_pimenton],
}, settings);
ok('tope duro 3990 aunque el ingrediente sea carísimo', cara, 3990);
const conExtras = precioEmpanada(
  { proteina: porId.p_pollo, queso: porId.q_vegano, acompanamientos: [porId.a_tomate, porId.a_champinon, porId.a_acelga, porId.a_zapallo] },
  settings, extrasAgregados({ proteina: true, queso: true }, { precios: SETTINGS_SEED.precios }),
);
ok('extras no superan el tope', conExtras, 3990);
const vacia = precioEmpanada({ proteina: null, queso: null, acompanamientos: [] }, settings);
ok('piso 3490 sin ingredientes', vacia, 3490);

// Empanadas del día: universo COMPLETO (saladas + dulces), 3 por día, ciclo sin repetir
import { combinacionDelDia, combinacionesDelDia } from '../src/lib/daily.js';
import { SETTINGS_SEED } from '../src/data/catalogoSeed.js';
const dulceLine = {
  proteinas: CATALOGO_SEED.filter((i) => i.categoria === 'proteina' && i.linea === 'dulce'),
  quesos: salada.quesos, // CatalogContext inyecta los quesos salada en la línea dulce
  acompanamientos: CATALOGO_SEED.filter((i) => i.categoria === 'acompanamiento' && i.linea === 'dulce'),
};
const lineas = [
  { id: 'salada', ...salada, cantidadAcompanamientos: 4 },
  { id: 'dulce', ...dulceLine },
];
const S = totalCombinaciones(lineas[0]);
const D = dulceLine.proteinas.length * dulceLine.quesos.length * dulceLine.acompanamientos.length;
const N = S + D;
const T = Math.ceil(N / 3);
const diaFecha = (d) => new Date(2026, 0, 5 + d);
const trioA = combinacionesDelDia({ lineas, settings: SETTINGS_SEED, porId, fecha: diaFecha(0) });
const trioB = combinacionesDelDia({ lineas, settings: SETTINGS_SEED, porId, fecha: diaFecha(0) });
ok('del día = 3 recetas', trioA.length, 3);
ok('del día deterministas', trioA.every((c, i) => c.clave === trioB[i].clave) ? 'si' : 'no', 'si');
ok('del día precio 2990', trioA.every((c) => c.precio === 2990) ? 2990 : 'otro', 2990);
ok('universo = saladas + dulces', N, 7920 + 176);
// Recorrer el ciclo completo: cada receta 1 vez, dulces repartidas por todo el viaje
const vistas = new Set();
const recetaClave = (c) => `${c.proteinaId}|${c.quesoId}|${c.acompanamientosIds.join(',')}`;
let dulces = 0, diasConDulce = 0, primerDulce = -1, ultimoDulce = -1;
for (let d = 0; d < T; d++) {
  const combos = combinacionesDelDia({ lineas, settings: SETTINGS_SEED, porId, fecha: diaFecha(d) });
  combos.forEach((c) => {
    vistas.add(recetaClave(c));
    if (c.linea === 'dulce') {
      dulces++;
      if (primerDulce < 0) primerDulce = d;
      ultimoDulce = d;
    }
  });
  if (combos.some((c) => c.linea === 'dulce')) diasConDulce++;
}
ok('ciclo cubre todas las recetas sin repetir', vistas.size, N);
ok('dulces repartidas en todo el ciclo', dulces, D);
ok('los días con dulce llegan hasta el final', ultimoDulce > Math.floor(T * 0.8) ? 'si' : 'no', 'si');
ok('hay días solo saladas y días con dulce', diasConDulce > 0 && diasConDulce < T ? 'si' : 'no', 'si');
const diaA = combinacionDelDia({ lineas, settings: SETTINGS_SEED, porId, fecha: diaFecha(0) });
ok('primera del día coincide', diaA?.clave, trioA[0].clave);

// Línea dulce: 1 relleno + 1 queso (los de la salada) + hasta 4 extras, rango [2790, 3390]
import { rangoEmpanada } from '../src/lib/precios.js';
const rangoD = rangoEmpanada(SETTINGS_SEED, 'dulce');
ok('dulce rango mín 2790', rangoD.min, 2790);
ok('dulce rango máx 3390', rangoD.max, 3390);

const soloBase = precioEmpanada(
  { proteina: porId.d_membrillo, queso: porId.q_vegano, acompanamientos: [] },
  SETTINGS_SEED, 0, 0, 'dulce',
);
ok('dulce base mín (membrillo + vegano) = 2790', soloBase, 2790);

const dulceMax = precioEmpanada(
  { proteina: porId.d_nutella, queso: porId.q_gouda, acompanamientos: [porId.d_chancaca] },
  SETTINGS_SEED, 0, 0, 'dulce',
);
ok('dulce nutella + gouda + chancaca = 3390', dulceMax, 3390);

const dulceCara = precioEmpanada(
  { proteina: { id: 'x', categoria: 'proteina', precio: 9999 }, queso: porId.q_gouda, acompanamientos: [porId.d_chancaca] },
  SETTINGS_SEED, 0, 0, 'dulce',
);
ok('dulce tope duro 3390', dulceCara, 3390);

const dulceManjar = precioEmpanada(
  { proteina: porId.d_manjar, queso: porId.q_llanero, acompanamientos: [porId.d_nuez] },
  SETTINGS_SEED, 0, 0, 'dulce',
);
ok('dulce manjar + llanero + nuez = 3110', dulceManjar, 3110);

const dulceFrutas = precioEmpanada(
  { proteina: porId.d_chocolate, queso: porId.q_gouda, acompanamientos: [porId.d_pina] },
  SETTINGS_SEED, 0, 0, 'dulce',
);
ok('dulce chocolate + gouda + piña = 3230', dulceFrutas, 3230);

const dulceMermelada = precioEmpanada(
  { proteina: porId.d_nutella, queso: porId.q_mozzarella, acompanamientos: [porId.d_mermelada] },
  SETTINGS_SEED, 0, 0, 'dulce',
);
ok('dulce nutella + mozzarella + mermelada = 3350', dulceMermelada, 3350);

const lineaDulce = {
  proteinas: CATALOGO_SEED.filter((i) => i.categoria === 'proteina' && i.linea === 'dulce'),
  quesos: CATALOGO_SEED.filter((i) => i.categoria === 'queso' && i.linea === 'salada'),
  acompanamientos: CATALOGO_SEED.filter((i) => i.categoria === 'acompanamiento' && i.linea === 'dulce'),
  cantidadAcompanamientos: 1,
};
ok('dulce: 4 rellenos', lineaDulce.proteinas.length, 4);
ok('dulce: 4 quesos (los salada)', lineaDulce.quesos.length, 4);
ok('dulce: 11 extras', lineaDulce.acompanamientos.length, 11);
ok('total combinaciones dulce = 176', totalCombinaciones(lineaDulce), 176);

// Nombre profesional: proteína con queso, sin apodos inventados
import { generarNombre } from '../src/lib/nombres.js';
ok('nombre salada descriptivo',
  generarNombre({ proteina: porId.p_pollo, queso: porId.q_gouda }), 'Pollo con Gouda');
ok('nombre dulce descriptivo',
  generarNombre({ proteina: porId.d_nutella, queso: porId.q_gouda }), 'Nutella con Gouda');
ok('nombre sin queso = solo proteína',
  generarNombre({ proteina: porId.p_carne, queso: null }), 'Carne picada');
ok('nombre sin nada = Empanada',
  generarNombre({ proteina: null, queso: null }), 'Empanada');
const nombreDulce = generarNombre({ proteina: porId.d_nutella, queso: porId.q_gouda });
si('nombre no lleva sufijos inventados',
  !/(express|premium|v2|xl|abuela|fiestera|tentación|poderoso)/i.test(nombreDulce));

// Inventario: rendimiento en empanadas, alertas, consumo por pedido y signos
import { rendimientoEmpanadas, alertasStock, consumoStockPedido, signoStock, UMBRAL_DEFECTO } from '../src/lib/stock.js';
ok('rendimiento = floor(stock/porción)', rendimientoEmpanadas({ stockGramos: 750, porcionGramos: 70 }), 10);
ok('stock sin cargar = null', rendimientoEmpanadas({ porcionGramos: 70 }), null);
ok('umbral por defecto = 10', UMBRAL_DEFECTO, 10);

const alertas = alertasStock({
  ingredientes: [
    { id: 'a', nombre: 'Pollo', stockGramos: 700, porcionGramos: 70 },   // 10 → alerta
    { id: 'b', nombre: 'Carne', stockGramos: 7000, porcionGramos: 70 },  // 100 → ok
    { id: 'c', nombre: 'Queso' },                                       // sin cargar → no
  ],
  bebidas: [
    { id: 'd1', nombre: 'Coca', stockUnidades: 5 }, // alerta
    { id: 'd2', nombre: 'Fanta' },                  // sin cargar → no
  ],
  settings: { inventario: { umbralEmpanadas: 10 } },
});
ok('alertas = 2 (umbral + bebida)', alertas.length, 2);
ok('ordenadas de más urgente', alertas[0].rendimiento <= alertas[1].rendimiento ? 'si' : 'no', 'si');

const pedidoStock = {
  items: [
    { tipo: 'empanada', cantidad: 2, proteinaId: 'p1', quesoId: 'q1', acompanamientosIds: ['a1', 'a2'], extras: { proteina: true, acomp: ['a3'] } },
    { tipo: 'bebida', id: 'b_coca', cantidad: 3 },
  ],
};
const consumo = consumoStockPedido(pedidoStock, {
  porId: {
    p1: { porcionGramos: 70 }, q1: { porcionGramos: 40 },
    a1: { porcionGramos: 15 }, a2: { porcionGramos: 15 }, a3: { porcionGramos: 15 },
  },
  settings: { masa: { porcionGramos: 90 } },
});
ok('masa: 2 empanadas × 90 g', consumo.masaGramos, 180);
ok('proteína con extra: 70×2 + 70×2', consumo.ings.p1, 280);
ok('acompañamiento extra: 15×2', consumo.ings.a3, 30);
ok('bebidas: 3 latas', consumo.bebs.b_coca, 3);

ok('confirmar pago descuenta', signoStock({ status: 'pendiente_pago' }, 'pago_confirmado'), 1);
ok('avanzar estado ya descontado no descuenta', signoStock({ status: 'pago_confirmado', stockDescontado: true }, 'en_preparacion'), 0);
ok('volver a pendiente devuelve stock', signoStock({ status: 'pago_confirmado', stockDescontado: true }, 'pendiente_pago'), -1);
ok('pendiente sin flag no devuelve', signoStock({ status: 'pendiente_pago' }, 'pendiente_pago'), 0);

// Costos y margen
import { costoPorcion, costoEmpanadaItem, costoPedido, margenPedido } from '../src/lib/costos.js';
ok('porción 100 g × 2000/kg = 200', costoPorcion({ porcionGramos: 100, costoKg: 2000 }), 200);
const ctxCosto = {
  porId: {
    p: { porcionGramos: 100, costoKg: 2000 },
    q: { porcionGramos: 50, costoKg: 4000 },
    a: { porcionGramos: 20, costoKg: 1000 },
  },
  settings: { masa: { porcionGramos: 100, costoKg: 1000 } },
};
ok('costo empanada = masa + p + q + 1 a', costoEmpanadaItem({ proteinaId: 'p', quesoId: 'q', acompanamientosIds: ['a'] }, ctxCosto.porId, ctxCosto.settings), 520);
ok('extras suman porciones (100+200+200+200)', costoEmpanadaItem({ proteinaId: 'p', quesoId: 'q', acompanamientosIds: [], extras: { proteina: true } }, ctxCosto.porId, ctxCosto.settings), 700);
const pedidoCosto = {
  items: [
    { tipo: 'empanada', cantidad: 2, proteinaId: 'p', quesoId: 'q', acompanamientosIds: ['a'] },
    { tipo: 'bebida', id: 'b1', cantidad: 1 },
  ],
  totales: { total: 8000 },
};
const ctxPedido = { ...ctxCosto, porBebida: { b1: { costo: 1000 } } };
ok('costo pedido = 2×520 + bebida 1000', costoPedido(pedidoCosto, ctxPedido), 2040);
ok('margen = cobrado − costo', margenPedido(pedidoCosto, ctxPedido), 8000 - 2040);

// Desglose del precio que ve el cliente en la ficha del pedido
import { desgloseEmpanada } from '../src/lib/precios.js';

const selFicha = {
  proteina: porId.p_pollo, queso: porId.q_vegano,
  acompanamientos: [porId.a_choclo, porId.a_pimenton, porId.a_espinaca, porId.a_tomate],
};
const sumaLineas = (d) => d.ingredientes.reduce((s, l) => s + l.aporte, 0);

const dg = desgloseEmpanada(selFicha, SETTINGS_SEED, {}, 0, 'salada');
ok('ficha: total = 3500', dg.total, 3500);
ok('ficha: una línea por ingrediente', dg.ingredientes.length, 6);
ok('ficha: proteína primera', dg.ingredientes[0].tipo, 'proteina');
ok('ficha: queso segundo', dg.ingredientes[1].tipo, 'queso');
ok('ficha: acompañamientos después', dg.ingredientes[2].tipo, 'acompanamiento');
si('ficha: cada línea trae nombre y emoji',
  dg.ingredientes.every((l) => typeof l.nombre === 'string' && typeof l.emoji === 'string'));
ok('ficha: suma de aportes = subtotal', sumaLineas(dg), dg.subtotalIngredientes);
ok('ficha: sin ajuste cuando la suma cabe en el rango', dg.ajuste, 0);
ok('ficha: sin ajuste no se etiqueta', dg.ajusteTipo, null);
si('ficha: cierra (subtotal + extras + ajuste = total)',
  dg.subtotalIngredientes + dg.extrasTotal + dg.reservaFaltantes + dg.ajuste === dg.total);
si('ficha: coincide con precioEmpanada',
  dg.total === precioEmpanada(selFicha, SETTINGS_SEED, 0, 0, 'salada'));

// Extras por encima del tope: el ajuste queda explícito y el total cierra
const dgEx = desgloseEmpanada(selFicha, SETTINGS_SEED, { proteina: true, queso: true }, 0, 'salada');
ok('ficha: extras = 900 + 700', dgEx.extrasTotal, 1600);
ok('ficha: dos filas de extras', dgEx.extras.length, 2);
ok('ficha: el tope frena el bruto', dgEx.bruto, 5100);
ok('ficha: total topeado a 3990', dgEx.total, 3990);
ok('ficha: ajuste negativo por el tope', dgEx.ajusteTipo, 'maximo');
si('ficha: cierra con extras', dgEx.bruto + dgEx.ajuste === dgEx.total);
ok('ficha: extras coinciden con extrasAgregados',
  dgEx.extrasTotal, extrasAgregados({ proteina: true, queso: true }, { precios: SETTINGS_SEED.precios }));

// Piso: cuando la suma queda bajo el rango
const dgPiso = desgloseEmpanada(
  { proteina: { id: 'x', categoria: 'proteina', nombre: 'X', emoji: '✨', precio: 0 }, queso: porId.q_vegano },
  SETTINGS_SEED, {}, 0, 'dulce',
);
ok('ficha: el piso sube el total', dgPiso.total, 2790);
ok('ficha: ajuste positivo por el piso', dgPiso.ajusteTipo, 'minimo');
si('ficha: cierra con el piso', dgPiso.bruto + dgPiso.ajuste === dgPiso.total);

// Línea dulce: relleno/extra y sin extras de salada
const dgDulce = desgloseEmpanada(
  { proteina: porId.d_nutella, queso: porId.q_gouda, acompanamientos: [porId.d_chancaca] },
  SETTINGS_SEED, { proteina: true }, 0, 'dulce',
);
ok('dulce ficha: etiqueta del relleno', dgDulce.ingredientes[0].tipo, 'relleno');
ok('dulce ficha: el acompañamiento es extra', dgDulce.ingredientes[2].tipo, 'extra');
ok('dulce ficha: los extras de salada no aplican', dgDulce.extras.length, 0);
ok('dulce ficha: total 3390', dgDulce.total, 3390);
si('dulce ficha: cierra', dgDulce.subtotalIngredientes + dgDulce.ajuste === dgDulce.total);

// Consistencia: el desglose siempre cierra con precioEmpanada
[
  { sel: selFicha, extras: {}, faltan: 0, linea: 'salada' },
  { sel: { proteina: porId.p_pollo, queso: porId.q_vegano, acompanamientos: [porId.a_tomate] }, extras: {}, faltan: 3, linea: 'salada' },
  { sel: { proteina: porId.p_pollo, queso: porId.q_vegano, acompanamientos: [porId.a_tomate] }, extras: { proteina: true }, faltan: 2, linea: 'salada' },
  { sel: { proteina: porId.d_manjar, queso: porId.q_llanero, acompanamientos: [porId.d_nuez] }, extras: {}, faltan: 0, linea: 'dulce' },
].forEach((c, i) => {
  const d = desgloseEmpanada(c.sel, SETTINGS_SEED, c.extras, c.faltan, c.linea);
  const p = precioEmpanada(c.sel, SETTINGS_SEED, extrasAgregados(c.extras, { precios: SETTINGS_SEED.precios }), c.faltan, c.linea);
  ok(`ficha: cierra con precioEmpanada caso ${i + 1}`, d.total, p);
  si(`ficha: la suma de las líneas cierra caso ${i + 1}`,
    d.bruto + d.ajuste === d.total && d.bruto === sumaLineas(d) + d.extrasTotal + d.reservaFaltantes);
});

// Desglose de lo que ya está en el carrito (desde los ids guardados)
import { desgloseDeItem } from '../src/lib/precios.js';

const itemCarro = {
  linea: 'salada',
  nombre: 'Carne picada con Gouda',
  proteinaId: 'p_carne', quesoId: 'q_gouda',
  acompanamientosIds: ['a_tomate', 'a_choclo', 'a_champinon', 'a_palmitos'],
  extras: { proteina: false, queso: false, acomp: [] },
  extrasCount: 0,
  precioUnitario: 3715,
};
const itemOk = desgloseDeItem(itemCarro, { porId, settings: SETTINGS_SEED });
ok('carro: una línea por ingrediente', itemOk.ingredientes.length, 6);
ok('carro: cierra con el precio guardado', itemOk.total, 3715);
ok('carro: sin ajuste si la receta cuadra', itemOk.ajuste, 0);
ok('carro: sin etiqueta de ajuste', itemOk.etiquetaAjuste, null);
si('carro: se puede mostrar el detalle', itemOk.conDetalles === true);
si('carro: subtotal = suma de aportes',
  itemOk.subtotalIngredientes === sumaLineas(itemOk) && itemOk.bruto + itemOk.ajuste === itemOk.total);

// Precio del día: cobra menos que la suma de aportes y hay que explicarlo
const itemDia = desgloseDeItem({ ...itemCarro, precioUnitario: 2990, esDelDia: true }, { porId, settings: SETTINGS_SEED });
ok('carro del día: total = precio del día', itemDia.total, 2990);
ok('carro del día: etiqueta especial', itemDia.etiquetaAjuste, 'Precio del día');
ok('carro del día: ajuste negativo', itemDia.ajuste, 2990 - itemDia.bruto);
si('carro del día: cierra', itemDia.bruto + itemDia.ajuste === itemDia.total);

// Extras de salada en el carrito
const itemExtras = desgloseDeItem({
  ...itemCarro,
  extras: { proteina: true, queso: true, acomp: [] },
  extrasCount: 2,
  precioUnitario: 3990,
}, { porId, settings: SETTINGS_SEED });
ok('carro con extras: suma los dos extras', itemExtras.extrasTotal, 1600);
ok('carro con extras: total cobrado', itemExtras.total, 3990);
si('carro con extras: cierra (tope aplicado)', itemExtras.bruto + itemExtras.ajuste === 3990);

// Línea dulce en el carrito
const itemDulce = desgloseDeItem({
  linea: 'dulce',
  proteinaId: 'd_nutella', quesoId: 'q_gouda', acompanamientosIds: ['d_chancaca'],
  extras: { proteina: false, queso: false, acomp: [] },
  precioUnitario: 3390,
}, { porId, settings: SETTINGS_SEED });
ok('carro dulce: etiqueta del relleno', itemDulce.ingredientes[0].tipo, 'relleno');
ok('carro dulce: el acompañamiento es extra', itemDulce.ingredientes[2].tipo, 'extra');
ok('carro dulce: total 3390', itemDulce.total, 3390);

// Ingrediente que ya no existe en el catálogo → no se muestra detalle inventado
const itemRoto = desgloseDeItem({ ...itemCarro, proteinaId: 'no_existe' }, { porId: {}, settings: SETTINGS_SEED });
si('carro sin receta: no muestra detalle', itemRoto.conDetalles === false);

// Item sin precio guardado → usa el cálculo del rango
const itemSinPrecio = desgloseDeItem({ ...itemCarro, precioUnitario: undefined }, { porId, settings: SETTINGS_SEED });
ok('carro sin precio: calcula el precio', itemSinPrecio.total, 3715);

// ---------- WhatsApp: pedido completo al número fijo de pedidos ----------
import { fmtCLP } from '../src/lib/formato.js';
import { generarTicket, linkWhatsApp, enviarPedidoWhatsApp, urlWhatsAppPedidos, WHATSAPP_PEDIDOS } from '../src/lib/ticket.js';

const pedidoWsp = {
  numero: 7,
  items: [
    {
      tipo: 'empanada', nombre: 'Carne a la paila', proteina: 'Carne picada', queso: 'Gouda',
      acompanamientos: ['Tomate', 'Choclo'], extrasCount: 1, etiquetas: ['picante'],
      cantidad: 2, precioUnitario: 3490,
    },
    { tipo: 'bebida', nombre: 'Lata de Coca-Cola', emoji: '🥤', cantidad: 2, precio: 1700 },
  ],
  cliente: {
    nombre: 'María José', telefono: '+56987654321',
    direccion: 'Av. Italia 1234', comuna: 'Maipú', referencias: 'Portón verde',
  },
  entrega: { fecha: 'sábado 24/10', hora: '13:00' },
  totales: { subtotal: 10380, ahorro: 300, delivery: 1000, total: 11080 },
  oferta: { ahorro: 300, detalle: ['2×3 empanadas'] },
};

ok('WhatsApp: número fijo de pedidos', WHATSAPP_PEDIDOS, '56935438480');
const wspUrl = linkWhatsApp(pedidoWsp);
si('WhatsApp: URL wa.me/56935438480', wspUrl.startsWith('https://wa.me/56935438480?text='));
const wspTexto = decodeURIComponent(wspUrl.slice(wspUrl.indexOf('?text=') + 6));
si('WhatsApp: nombre con acentos intactos', wspTexto.includes('María José'));
si('WhatsApp: dirección y comuna', wspTexto.includes('Av. Italia 1234, Maipú'));
si('WhatsApp: teléfono de contacto', wspTexto.includes('+56987654321'));
si('WhatsApp: precio unitario de empanada', wspTexto.includes(`${fmtCLP(3490)} c/u`));
si('WhatsApp: línea total de empanadas', wspTexto.includes(fmtCLP(3490 * 2)));
si('WhatsApp: precio unitario de bebida', wspTexto.includes(`${fmtCLP(1700)} c/u`));
si('WhatsApp: opciones de la receta', wspTexto.includes('🥩 Carne picada') && wspTexto.includes('🥗 Tomate, Choclo'));
si('WhatsApp: subtotal', wspTexto.includes(`Subtotal: *${fmtCLP(10380)}*`));
si('WhatsApp: ahorro de oferta', wspTexto.includes(`Ahorro: *-${fmtCLP(300)}*`));
si('WhatsApp: delivery', wspTexto.includes(`Delivery: *${fmtCLP(1000)}*`));
si('WhatsApp: total igual al checkout', wspTexto.includes(`TOTAL: ${fmtCLP(11080)}`));
si('WhatsApp: entrega', wspTexto.includes('Entrega: sábado 24/10 a las 13:00'));
si('WhatsApp: número de pedido', wspTexto.includes('#0007'));
si('WhatsApp: conserva saltos de línea', wspTexto.includes('\n'));

// enviarPedidoWhatsApp: abre el chat directo; la imagen va por compartir o
// portapapeles (en node la generación de imagen no corre → queda en 'abierto')
const abiertas = [];
globalThis.window = { open: (url) => { abiertas.push(url); return {}; } };
const rEnvio = await enviarPedidoWhatsApp({ pedido: pedidoWsp });
delete globalThis.window;
ok('WhatsApp: URL directa del chat de pedidos', urlWhatsAppPedidos(), 'https://wa.me/56935438480');
ok('WhatsApp: enviar abre el chat', rEnvio, 'abierto');
si('WhatsApp: destino exacto y SIN ?text= (no se mandan palabras)',
  abiertas.length === 1 && abiertas[0] === 'https://wa.me/56935438480');

// Carrito vacío o pedido nulo: no abre nada y no revienta
const abiertas2 = [];
globalThis.window = { open: (url) => { abiertas2.push(url); return {}; } };
const rVacio = await enviarPedidoWhatsApp({ pedido: { items: [] } });
const rNulo = await enviarPedidoWhatsApp({ pedido: null });
delete globalThis.window;
ok('WhatsApp: vacío/nulo no envía', `${rVacio}/${rNulo}`, 'error/error');
si('WhatsApp: vacío/nulo no abre ventanas', abiertas2.length === 0);

// Datos incompletos: el ticket sigue generándose sin errores
const ticketSuelto = generarTicket({ numero: 1, items: [{ tipo: 'empanada', nombre: 'Sin precio', cantidad: 1 }] });
si('WhatsApp: tolera cliente/totales/entrega faltantes', ticketSuelto.includes('#0001') && !ticketSuelto.includes('undefined'));
si('WhatsApp: item sin precio no inventa monto', !ticketSuelto.includes(' c/u'));

// ================= REPORTES =================
const porIdRep = Object.fromEntries(CATALOGO_SEED.map((i) => [i.id, i]));
const ctxRep = {
  porId: porIdRep,
  bebidas: BEBIDAS_SEED,
  settings: { masa: { porcionGramos: 90, costoKg: 2500 }, inventario: {} },
};
const pedRep = (id, fecha, extra = {}) => ({
  id, numero: id, status: 'pago_confirmado', createdAt: fecha,
  cliente: { nombre: 'Ana Pérez', telefono: '912345678', comuna: 'Maipú' },
  items: [{
    tipo: 'empanada', cantidad: 2, proteinaId: 'p_carne', quesoId: 'q_gouda',
    acompanamientosIds: ['a_choclo'], precio: 2990, clave: 'k1',
  }],
  totales: { total: 5980, ahorro: 0, delivery: 1000 },
  ...extra,
});
const listaRep = [
  pedRep(1, '2026-10-10T18:00:00.000Z'),
  pedRep(2, '2026-10-12T20:00:00.000Z', {
    cliente: { nombre: 'Luis Soto', telefono: '987654321', comuna: 'Ñuñoa' },
    items: [{ tipo: 'empanada', cantidad: 1, proteinaId: 'p_pollo', quesoId: 'q_gouda', acompanamientosIds: [], precio: 2990, clave: 'k2' },
      { tipo: 'bebida', id: 'b_coca', nombre: 'Coca-Cola lata', cantidad: 1, precio: 1700 }],
    totales: { total: 4690, ahorro: 0, delivery: 0 },
  }),
  pedRep(3, '2026-10-15T19:00:00.000Z', { status: 'pendiente_pago' }),
  pedRep(4, '2026-09-30T18:00:00.000Z'), // fuera de octubre
];
const perRep = periodoRango('mes', '2026-10');
const rep = construirReporte(listaRep, ctxRep, perRep);

ok('reporte: solo pedidos del período', rep.kpis.pedidos, 3);
ok('reporte: ventas solo de pagados', rep.kpis.ventas, 5980 + 4690);
si('reporte: margen positivo', rep.kpis.margen > 0 && rep.kpis.margen < rep.kpis.ventas);
ok('reporte: empanadas vendidas (2+1, pagados)', rep.kpis.empanadasVendidas, 3);
ok('reporte: clientes únicos', rep.kpis.clientesUnicos, 2);
ok('reporte: top cliente es Ana', rep.topClientes[0]?.nombre, 'Ana Pérez');
ok('reporte: comuna top Maipú', rep.porComuna[0]?.comuna, 'Maipú');
ok('reporte: dos productos distintos', rep.porProducto.length, 2);
si('reporte: insights generados', Array.isArray(rep.insights) && rep.insights.length >= 6);
si('reporte: porDiario ordenado', rep.porDia.every((d, i, a) => i === 0 || a[i - 1].fecha < d.fecha));
si('reporte: ingredientes con costo', rep.ingredientes.some((i) => i.costoTotal > 0));
ok('periodo anterior de octubre es septiembre', periodoAnterior(perRep).valor, '2026-09');
ok('periodo anterior de enero es diciembre del año previo', periodoAnterior(periodoRango('mes', '2026-01')).valor, '2025-12');
ok('año anterior', periodoAnterior(periodoRango('anio', '2026')).valor, '2025');
si('períodos disponibles (mes)', periodosDisponibles('mes').length >= 12);
si('períodos disponibles (año)', periodosDisponibles('anio').length >= 2);

// Generación real de archivos en node (exceljs y docx corren sin navegador)
const blobExcel = await generarExcelReporte(rep);
const bufExcel = Buffer.from(await blobExcel.arrayBuffer());
si('Excel: tamaño razonable', bufExcel.length > 4000);
si('Excel: es un zip válido (PK)', bufExcel[0] === 0x50 && bufExcel[1] === 0x4b);
si('Excel: nombre de archivo', nombreArchivoReporte(perRep, 'xlsx') === 'abuela-rosa-reporte-2026-10.xlsx');

const blobWord = await generarInformeWord(rep, { incluirGraficos: false });
const bufWord = Buffer.from(await blobWord.arrayBuffer());
si('Word: tamaño razonable', bufWord.length > 3000);
si('Word: es un zip válido (PK)', bufWord[0] === 0x50 && bufWord[1] === 0x4b);

console.log(fallos === 0 ? '\n✓ Todas las pruebas pasaron' : `\n✗ ${fallos} prueba(s) fallaron`);
process.exit(fallos === 0 ? 0 : 1);
