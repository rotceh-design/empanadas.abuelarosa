// Pruebas del flujo de administración en modo local/demo (sin Firebase).
// Cubre: altas de pedido, numeración, observador, máquina de estados con
// descuento/devolución de stock, CRUD de catálogo y ofertas, patch de
// settings, historial de movimientos y carga de las páginas del panel.
import { limpiarStorage } from './shim-localstorage.mjs';
import {
  crearPedido, observarPedidos, cambiarEstado, ESTADOS, diasProduccion,
} from '../src/lib/pedidos.js';
import {
  guardarDoc, eliminarDoc, guardarSettingsPatch, aplicarOverlay,
  leerOverlayInicial, suscribirOverlay, registrarMovimiento, leerLog,
} from '../src/lib/inventario.js';
import { SETTINGS_SEED, OFERTAS_SEED, REGLAS_SEED } from '../src/data/catalogoSeed.js';

import AdminPanel from '../src/pages/admin/AdminPanel.jsx';
import AdminPedidos from '../src/pages/admin/AdminPedidos.jsx';
import AdminCatalogo from '../src/pages/admin/AdminCatalogo.jsx';
import AdminInventario from '../src/pages/admin/AdminInventario.jsx';
import AdminOfertas from '../src/pages/admin/AdminOfertas.jsx';
import AdminProduccion from '../src/pages/admin/AdminProduccion.jsx';
import AdminMetricas from '../src/pages/admin/AdminMetricas.jsx';
import AdminConfig from '../src/pages/admin/AdminConfig.jsx';
import AdminLogin from '../src/pages/admin/AdminLogin.jsx';
import AdminLayout from '../src/pages/admin/AdminLayout.jsx';

let fallos = 0;

function ok(nombre, obtenido, esperado) {
  const pasa = obtenido === esperado;
  if (!pasa) fallos++;
  console.log(`${pasa ? '✓' : '✗'} ${nombre}: ${obtenido}${pasa ? '' : ` (esperado ${esperado})`}`);
}

const si = (nombre, cond) => ok(nombre, cond ? 'si' : 'no', 'si');

function seccion(titulo) {
  console.log(`\n— ${titulo}`);
}

// ---------------------------------------------------------------- helpers

const KEY_PEDIDOS = 'empanadas_pedidos_local';
const leerPedidos = () => JSON.parse(localStorage.getItem(KEY_PEDIDOS) || '[]');

const pedidoDePrueba = () => ({
  cliente: { nombre: 'Ana Test', telefono: '+56911111111', comuna: 'Maipú' },
  items: [
    { tipo: 'empanada', cantidad: 2, proteinaId: 'p1', quesoId: 'q1', acompanamientosIds: ['a1'] },
    { tipo: 'bebida', id: 'b_coca', cantidad: 2 },
  ],
  totales: { subtotal: 5980, ahorro: 0, delivery: 0, total: 5980 },
  entrega: { fecha: '2026-10-16', hora: '19:00' },
});

const SEED_ING = [
  { id: 'p1', nombre: 'Pollo', categoria: 'proteina', porcionGramos: 70, stockGramos: 1000 },
  { id: 'q1', nombre: 'Queso', categoria: 'queso', porcionGramos: 25 }, // sin stock cargado
  { id: 'a1', nombre: 'Tomate', categoria: 'acompanamiento', porcionGramos: 20, stockGramos: 500 },
];
const SEED_BEB = [{ id: 'b_coca', nombre: 'Coca', precio: 1700, stockUnidades: 10 }];
const settingsConMasa = () => ({
  ...SETTINGS_SEED,
  inventario: { ...SETTINGS_SEED.inventario, masaGramos: 1000 },
});

// Reconstruye el contexto igual que hace la UI: parte de la semilla y le
// aplica el overlay, que es donde `aplicarStock` acaba de escribir.
function ctxVivo() {
  const { ingredientes, bebidas, settings } = aplicarOverlay(
    { ingredientes: SEED_ING, bebidas: SEED_BEB, settings: settingsConMasa() },
    leerOverlayInicial(),
  );
  return { porId: Object.fromEntries(ingredientes.map((i) => [i.id, i])), bebidas, settings };
}

const overlay = () => leerOverlayInicial();

async function main() {
  // ---------------------------------------------------- 1. Alta de pedidos
  seccion('Alta de pedidos y numeración');
  limpiarStorage();

  const p1 = await crearPedido(pedidoDePrueba());
  const p2 = await crearPedido(pedidoDePrueba());
  const p3 = await crearPedido(pedidoDePrueba());

  ok('primer número de pedido', p1.numero, 101);
  ok('números consecutivos', p2.numero, 102);
  ok('tercer número único', p3.numero, 103);
  ok('status inicial', p1.status, 'pendiente_pago');
  si('createdAt ISO presente', /^\d{4}-\d{2}-\d{2}T/.test(p1.createdAt || ''));
  si('cliente guardado', p1.cliente?.nombre === 'Ana Test');
  ok('quedan 3 pedidos en storage', leerPedidos().length, 3);
  ok('los números en storage son únicos',
    new Set(leerPedidos().map((o) => o.numero)).size, 3);

  // ------------------------------------------------------- 2. Observador
  seccion('Observador de pedidos (modo local)');
  limpiarStorage();

  let vistos = null;
  const off = observarPedidos((lista) => { vistos = lista; });
  si('entrega la lista inicial', Array.isArray(vistos) && vistos.length === 0);

  await crearPedido(pedidoDePrueba());
  si('avisa al nacer un pedido', vistos?.length === 1);
  si('el pedido notificado tiene id', typeof vistos?.[0]?.id === 'string' && vistos[0].id.length > 0);

  await cambiarEstado(vistos[0], 'pago_confirmado', null);
  si('avisa al cambiar de estado', vistos[0]?.status === 'pago_confirmado');

  off();
  await crearPedido(pedidoDePrueba());
  ok('tras desuscribir ya no notifica', vistos.length, 1);

  // ----------------------------------------- 3. Máquina de estados + stock
  seccion('Flujo completo de estados con stock');
  limpiarStorage();

  const pedido = await crearPedido(pedidoDePrueba());
  const masaInicial = settingsConMasa().inventario.masaGramos;

  // 3.1 confirmar el pago consume stock
  await cambiarEstado(pedido, 'pago_confirmado', ctxVivo());
  let ov = overlay();
  let guardado = leerPedidos()[0];
  ok('pasa a pago_confirmado', guardado.status, 'pago_confirmado');
  ok('marca stockDescontado', guardado.stockDescontado, true);
  ok('descuenta proteína (1000 − 140)', ov.ingredientes.p1.stockGramos, 860);
  ok('descuenta acompañamiento (500 − 40)', ov.ingredientes.a1.stockGramos, 460);
  ok('no toca el ingrediente sin stock', ov.ingredientes.q1, undefined);
  ok('descuenta bebidas (10 − 2)', ov.bebidas.b_coca.stockUnidades, 8);
  ok('descuenta masa (1000 − 180)', ov.settings.inventario.masaGramos, masaInicial - 180);
  ok('conserva el umbral tras el descuento', ov.settings.inventario.umbralEmpanadas, 10);

  // 3.2 avanzar dentro del flujo: no vuelve a descontar
  await cambiarEstado(leerPedidos()[0], 'en_preparacion', ctxVivo());
  ok('avanza a en_preparacion', leerPedidos()[0].status, 'en_preparacion');
  ok('no descuenta dos veces', overlay().ingredientes.p1.stockGramos, 860);

  await cambiarEstado(leerPedidos()[0], 'en_reparto', ctxVivo());
  ok('avanza a en_reparto', leerPedidos()[0].status, 'en_reparto');
  ok('sin movimiento de stock en reparto', overlay().ingredientes.p1.stockGramos, 860);

  // 3.3 entregar
  await cambiarEstado(leerPedidos()[0], 'entregado', ctxVivo());
  ok('avanza a entregado', leerPedidos()[0].status, 'entregado');
  ok('stock sigue intacto al entregar', overlay().ingredientes.p1.stockGramos, 860);

  // 3.4 retroceso: devuelve todo
  await cambiarEstado(leerPedidos()[0], 'pendiente_pago', ctxVivo());
  ov = overlay();
  guardado = leerPedidos()[0];
  ok('vuelve a pendiente de pago', guardado.status, 'pendiente_pago');
  ok('devuelve proteína', ov.ingredientes.p1.stockGramos, 1000);
  ok('devuelve acompañamiento', ov.ingredientes.a1.stockGramos, 500);
  ok('devuelve bebidas', ov.bebidas.b_coca.stockUnidades, 10);
  ok('devuelve masa', ov.settings.inventario.masaGramos, masaInicial);
  ok('limpia la marca de descuento', guardado.stockDescontado, false);

  // 3.5 reconfirmar después del retroceso vuelve a consumir
  await cambiarEstado(leerPedidos()[0], 'pago_confirmado', ctxVivo());
  ok('reconfirmar descuenta otra vez', overlay().ingredientes.p1.stockGramos, 860);

  // ------------------------------------------------ 4. Catálogo en overlay
  seccion('CRUD de catálogo en modo demo');
  limpiarStorage();

  await guardarDoc('ingredients', 'p_pollo', { stockGramos: 2500 });
  let base = aplicarOverlay({ ingredientes: [{ id: 'p_pollo', nombre: 'Pollo', porcionGramos: 70 }] }, overlay());
  ok('alta/edición entra al overlay', base.ingredientes[0].stockGramos, 2500);
  ok('el merge conserva el resto del ingrediente', base.ingredientes[0].nombre, 'Pollo');

  await guardarDoc('drinks', 'b_coca', { stockUnidades: 24 });
  base = aplicarOverlay({ bebidas: [{ id: 'b_coca', nombre: 'Coca', precio: 1700 }] }, overlay());
  ok('bebida con stock cargado', base.bebidas[0].stockUnidades, 24);
  ok('el merge conserva el precio de la bebida', base.bebidas[0].precio, 1700);

  await eliminarDoc('ingredients', 'p_pollo');
  base = aplicarOverlay({ ingredientes: [{ id: 'p_pollo', nombre: 'Pollo' }] }, overlay());
  ok('baja: sale del catálogo', base.ingredientes.length, 0);

  await guardarDoc('ingredients', 'p_pollo', { stockGramos: 800 });
  base = aplicarOverlay({ ingredientes: [{ id: 'p_pollo', nombre: 'Pollo' }] }, overlay());
  ok('rehabilitar tras borrar vuelve a mostrarlo', base.ingredientes.length, 1);

  // -------------------------------------------------- 5. Ofertas y reglas
  seccion('CRUD de ofertas y reglas en modo demo');
  limpiarStorage();

  await guardarDoc('offers', 'of_nueva', { nombre: 'Promo 3+1', empanadas: 3, bebidas: 0, precio: 8500, activa: true, orden: 99 });
  base = aplicarOverlay({ ofertas: OFERTAS_SEED }, overlay());
  ok('oferta creada se suma al catálogo', base.ofertas.length, OFERTAS_SEED.length + 1);
  si('la oferta nueva aparece', base.ofertas.some((o) => o.id === 'of_nueva'));

  await guardarDoc('offers', 'o_1', { precio: 2790 });
  base = aplicarOverlay({ ofertas: OFERTAS_SEED }, overlay());
  const o1 = base.ofertas.find((o) => o.id === 'o_1');
  ok('oferta existente: precio actualizado', o1.precio, 2790);
  ok('oferta existente: conserva el nombre', o1.nombre, '1 empanada');

  await eliminarDoc('offers', 'o_2');
  base = aplicarOverlay({ ofertas: OFERTAS_SEED }, overlay());
  ok('oferta borrada desaparece', base.ofertas.some((o) => o.id === 'o_2'), false);
  ok('las demás siguen ahí', base.ofertas.length, OFERTAS_SEED.length);

  await guardarDoc('rules', 'r_nueva', { baseTipo: 'proteina', baseId: 'p_carne', acompanamientos: ['a_cebolla'], mensaje: 'Nueva regla' });
  base = aplicarOverlay({ reglas: REGLAS_SEED }, overlay());
  ok('regla creada se suma', base.reglas.length, REGLAS_SEED.length + 1);
  ok('regla seed intacta', base.reglas.find((r) => r.id === 'r_pollo').baseId, 'p_pollo');

  // ------------------------------------------- 6. Patch profundo de settings
  seccion('Patch de settings (merge profundo)');
  limpiarStorage();

  await guardarSettingsPatch({ inventario: { masaGramos: 750 } });
  await guardarSettingsPatch({ inventario: { umbralEmpanadas: 5 } });
  base = aplicarOverlay({ settings: settingsConMasa() }, overlay());
  ok('el segundo patch no borra la masa', base.settings.inventario.masaGramos, 750);
  ok('el segundo patch aplica el umbral', base.settings.inventario.umbralEmpanadas, 5);
  ok('el resto de settings queda igual', base.settings.precios.empanadaBase, SETTINGS_SEED.precios.empanadaBase);

  const avisos = [];
  const baja = suscribirOverlay((ov2) => avisos.push(ov2));
  await guardarSettingsPatch({ negocio: { whatsapp: '+56900000000' } });
  baja();
  ok('el overlay avisa a los suscriptores', avisos.length, 1);
  ok('el patch anidado llega completo', avisos[0]?.settings?.negocio?.whatsapp, '+56900000000');
  const negocio = aplicarOverlay({ settings: settingsConMasa() }, avisos[0]).settings.negocio;
  ok('y no borra el resto del negocio', negocio.nombre, SETTINGS_SEED.negocio.nombre);
  ok('el resto de settings sobrevive', negocio.ubicacion, SETTINGS_SEED.negocio.ubicacion);

  // ------------------------------------------------ 7. Historial de movimientos
  seccion('Historial de movimientos (compras y mermas)');
  limpiarStorage();

  await registrarMovimiento({
    tipo: 'compra', naturaleza: 'ingrediente', id: 'p1', nombre: 'Pollo',
    gramos: 5000, costo: 21500, nota: 'Feria La Pintana', merma: undefined,
  });
  await registrarMovimiento({
    tipo: 'conteo', naturaleza: 'bebida', id: 'b_coca', nombre: 'Coca',
    esperado: 10, real: 8, merma: 2, mermaCLP: 2000,
  });

  const log = await leerLog(25);
  ok('registra dos movimientos', log.length, 2);
  ok('lo más reciente va primero', log[0].tipo, 'conteo');
  si('se filtran los undefined', !('merma' in log[1]));
  ok('conserva la nota del más antiguo', log[1].nota, 'Feria La Pintana');
  ok('la merma queda registrada', log[0].merma, 2);
  ok('leerLog respeta el límite', (await leerLog(1)).length, 1);

  // ------------------------------------------------------ 8. Utilidades
  seccion('Utilidades del flujo');
  ok('ESTADOS tiene 5 pasos', ESTADOS.length, 5);
  ok('orden de los estados',
    ESTADOS.map((e) => e.id).join('>'),
    'pendiente_pago>pago_confirmado>en_preparacion>en_reparto>entregado');

  limpiarStorage();
  const dias = diasProduccion(['viernes', 'sábado', 'domingo']);
  ok('devuelve 6 días de producción', dias.length, 6);
  si('fechas con formato ISO', dias.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.fecha)));
  si('fechas únicas', new Set(dias.map((d) => d.fecha)).size === dias.length);
  si('fechas en orden ascendente', dias.every((d, i) => i === 0 || d.fecha > dias[i - 1].fecha));
  ok('sin días habilitados no devuelve nada', diasProduccion([]).length, 0);

  // ------------------------------------------------------ 9. Páginas admin
  seccion('Las páginas del panel cargan');
  const paginas = {
    AdminPanel, AdminPedidos, AdminCatalogo, AdminInventario, AdminOfertas,
    AdminProduccion, AdminMetricas, AdminConfig, AdminLogin, AdminLayout,
  };
  Object.entries(paginas).forEach(([nombre, fn]) => {
    si(`${nombre} exporta un componente`, typeof fn === 'function');
  });

  console.log(fallos === 0 ? '\n✓ Todas las pruebas del panel pasaron' : `\n✗ ${fallos} prueba(s) del panel fallaron`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('\n✗ Las pruebas del panel explotaron:', e);
  process.exit(1);
});
