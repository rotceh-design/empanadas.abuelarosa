// E2E del panel en modo demo: levanta Vite, abre Chrome y recorre el flujo
// completo en navegador — enlace de entrada, login demo, las 8 pestañas,
// alta de pedido, máquina de estados con stock, CRUD de ofertas y aviso
// en vivo entre pestañas (tienda ↔ admin).
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const PUERTO = Number(process.env.E2E_PORT || 5279);
const BASE = `http://localhost:${PUERTO}`;

let fallos = 0;

function ok(nombre, obtenido, esperado) {
  const pasa = obtenido === esperado;
  if (!pasa) fallos++;
  console.log(`${pasa ? '✓' : '✗'} ${nombre}: ${obtenido}${pasa ? '' : ` (esperado ${esperado})`}`);
}

const si = (nombre, cond) => ok(nombre, cond ? 'si' : 'no', 'si');
const seccion = (t) => console.log(`\n— ${t}`);

function encontrarChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    process.env.CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const ruta = candidatos.find((c) => existsSync(c));
  if (!ruta) throw new Error('No encontré Chrome/Edge. Define CHROME_PATH.');
  return ruta;
}

async function esperarServidor(url, ms = 45000) {
  const limite = Date.now() + ms;
  while (Date.now() < limite) {
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.status < 500) return true;
    } catch { /* aún no levanta */ }
    await sleep(300);
  }
  throw new Error(`El servidor no respondió en ${url}`);
}

// innerText de Chrome devuelve el texto YA transformado por CSS
// (text-transform: uppercase en .vt-btn y en varias etiquetas), así que
// todas las comparaciones de texto van en minúsculas.
const esperaTexto = (page, txt, ms = 10000) =>
  page.waitForFunction(
    (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
    { timeout: ms }, txt,
  );

const esperaUrl = (page, parte, ms = 10000) =>
  page.waitForFunction((p) => location.pathname.includes(p), { timeout: ms }, parte);

// Espera a que el h1 de la página diga lo esperado (y también cubre el
// Suspense de las rutas perezosas).
const esperaH1 = (page, txt, ms = 12000) =>
  page.waitForFunction((t) => {
    const h = document.querySelector('h1');
    return h && h.innerText.trim().toLowerCase() === t.toLowerCase();
  }, { timeout: ms }, txt);

// Botón/link por texto EXACTO (evita confundir el chip-filtro con la acción).
const clicExacto = async (page, texto) => {
  const manejador = await page.evaluateHandle((t) => {
    const objetivo = t.trim().toLowerCase();
    const nodos = [...document.querySelectorAll('button, a')];
    return nodos.find((n) => n.innerText.trim().toLowerCase() === objetivo) || null;
  }, texto);
  const el = manejador.asElement();
  if (el) { await el.click(); return; }
  const disponibles = await page.evaluate(() =>
    [...document.querySelectorAll('button, a')]
      .map((n) => n.innerText.trim())
      .filter(Boolean).slice(0, 40));
  throw new Error(`No encontré "${texto}". Botones en pantalla: ${disponibles.join(' | ')}`);
};

const contarOfertas = (page) =>
  page.$$eval('[aria-label="Nombre de la oferta"]', (els) => els.length);

const leerOverlay = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('empanadas_admin_local') || '{}'));

const leerPedido = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('empanadas_pedidos_local') || '[]')[0] || null);

const RUTAS = [
  ['/admin', 'Panel'],
  ['/admin/pedidos', 'Pedidos'],
  ['/admin/catalogo', 'Catálogo'],
  ['/admin/inventario', 'Inventario'],
  ['/admin/ofertas', 'Ofertas y reglas'],
  ['/admin/produccion', 'Producción diaria'],
  ['/admin/metricas', 'Métricas'],
  ['/admin/config', 'Configuración'],
];

const pedido1 = {
  id: 'e2e_1',
  numero: 101,
  status: 'pendiente_pago',
  createdAt: '2026-10-16T18:00:00.000Z',
  cliente: { nombre: 'Cliente E2E', telefono: '+56922223333', comuna: 'Maipú' },
  items: [
    {
      tipo: 'empanada', cantidad: 1, nombre: 'Pollo + Vegano',
      proteinaId: 'p_pollo', quesoId: 'q_vegano', acompanamientosIds: ['a_tomate'],
      proteina: 'Pollo', queso: 'Vegano', acompanamientos: ['Tomate'], extrasCount: 0,
    },
    { tipo: 'bebida', id: 'b_coca', cantidad: 1, nombre: 'Coca-Cola lata' },
  ],
  totales: { subtotal: 4690, ahorro: 0, delivery: 0, total: 4690 },
  entrega: { fecha: '2026-10-16', hora: '19:00' },
};

const pedido2 = {
  ...pedido1,
  id: 'e2e_2',
  numero: 102,
  cliente: { ...pedido1.cliente, nombre: 'Segundo E2E' },
};

const overlayInicial = {
  ingredientes: { p_pollo: { stockGramos: 1000 }, a_tomate: { stockGramos: 500 } },
  bebidas: { b_coca: { stockUnidades: 10 } },
  settings: { inventario: { masaGramos: 2000 } },
};

async function main() {
  console.log('Levantando Vite en', BASE);
  const servidor = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PUERTO), '--strictPort'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const logVite = [];
  servidor.stdout.on('data', (d) => logVite.push(String(d)));
  servidor.stderr.on('data', (d) => logVite.push(String(d)));

  let browser = null;
  const errores = [];

  try {
    await esperarServidor(BASE);

    browser = await puppeteer.launch({
      executablePath: encontrarChrome(),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--mute-audio', '--disable-gpu'],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    page.on('dialog', (d) => d.accept());
    page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const donde = m.location()?.url || '';
      const t = `${m.text()} ${donde}`;
      if (/favicon|Autofill|slow network|chrome-extension/i.test(t)) return;
      errores.push(`console: ${m.text()}${donde ? ` @ ${donde}` : ''}`);
    });

    // ------------------------------------------------- 1. Entrada visible
    seccion('Entrada al panel desde la tienda');
    await page.goto(BASE + '/configurar', { waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'Hecho con amor en Maipú');
    const hayEnlace = await page.evaluate(() =>
      [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/admin/login'));
    si('el pie enlaza al panel', hayEnlace);

    await page.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/admin/login').click());
    await esperaUrl(page, '/admin/login');
    await esperaTexto(page, 'Continuar en modo demo');
    si('llega al login y ofrece el modo demo', true);

    // ------------------------------------------------------ 2. Login demo
    seccion('Entrar en modo demo');
    await clicExacto(page, 'Continuar en modo demo');
    await esperaUrl(page, '/admin');
    await esperaH1(page, 'Panel');
    const h1Panel = await page.$eval('h1', (e) => e.innerText.trim());
    ok('el panel de control carga', h1Panel, 'Panel');
    await esperaTexto(page, 'Flujo de pedidos');
    const chips = await page.$$eval('a[href^="/admin/pedidos"]', (els) => els.length);
    si('muestra los 5 estados del flujo', chips >= 5);
    const accesos = await page.$$eval('section:last-of-type a[href^="/admin/"]', (els) => els.length);
    si('ofrece accesos directos a las secciones', accesos >= 7);

    // --------------------------------------------------- 3. Las 8 pestañas
    seccion('Las 8 pestañas del panel cargan');
    for (const [ruta, titulo] of RUTAS) {
      await page.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
      await esperaH1(page, titulo);
      const overlayError = await page.$('vite-error-overlay');
      ok(`${ruta} renderiza`, overlayError ? 'con error de Vite' : titulo, titulo);
    }

    // ------------------------------------------- 4. Pedido en el panel
    seccion('Un pedido aparece en el panel');
    await page.evaluate((ov, pedidos) => {
      localStorage.setItem('empanadas_admin_local', JSON.stringify(ov));
      localStorage.setItem('empanadas_pedidos_local', JSON.stringify(pedidos));
    }, overlayInicial, [pedido1]);
    await page.goto(BASE + '/admin', { waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'Cliente E2E');
    const cuerpo = await page.evaluate(() => document.body.innerText);
    const kpis = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll('.vt-ficha').forEach((f) => {
        const ps = f.querySelectorAll(':scope > p');
        if (ps.length >= 2) out[ps[0].textContent.trim()] = ps[1].textContent.trim();
      });
      return out;
    });
    ok('el KPI de pendientes marca 1', kpis['Pendientes de pago'], '1');
    si('el pedido sale en “Últimos pedidos”', cuerpo.includes('#0101') && cuerpo.includes('Cliente E2E'));

    // ------------------------------------- 5. Estados con stock en vivo
    seccion('Máquina de estados con descuento de stock');
    await page.goto(BASE + '/admin/pedidos', { waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'Cliente E2E');

    await clicExacto(page, '💰 Pago confirmado');
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem('empanadas_admin_local') || '{}')?.ingredientes?.p_pollo?.stockGramos === 930);
    ok('confirmar el pago descuenta la proteína', (await leerOverlay(page)).ingredientes.p_pollo.stockGramos, 930);
    ok('descuenta el acompañamiento', (await leerOverlay(page)).ingredientes.a_tomate.stockGramos, 480);
    ok('descuenta la bebida', (await leerOverlay(page)).bebidas.b_coca.stockUnidades, 9);
    ok('descuenta la masa', (await leerOverlay(page)).settings.inventario.masaGramos, 1910);
    ok('guarda la marca de descuento', (await leerPedido(page)).stockDescontado, true);
    ok('el pedido pasa a pago_confirmado', (await leerPedido(page)).status, 'pago_confirmado');

    await clicExacto(page, '🔥 En preparación');
    await esperaTexto(page, 'En preparación');
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem('empanadas_pedidos_local') || '[]')[0]?.status === 'en_preparacion');
    ok('no descuenta dos veces al avanzar', (await leerOverlay(page)).ingredientes.p_pollo.stockGramos, 930);

    await clicExacto(page, '⏳ Pendiente de pago');
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem('empanadas_pedidos_local') || '[]')[0]?.status === 'pendiente_pago');
    ok('volver a pendiente devuelve la proteína', (await leerOverlay(page)).ingredientes.p_pollo.stockGramos, 1000);
    ok('devuelve la masa', (await leerOverlay(page)).settings.inventario.masaGramos, 2000);
    ok('limpia la marca de descuento', (await leerPedido(page)).stockDescontado, false);

    // ------------------------------------------------------ 6. Ofertas CRUD
    seccion('Crear y borrar una oferta');
    await page.goto(BASE + '/admin/ofertas', { waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'Ofertas y reglas');
    const antes = await contarOfertas(page);
    ok('ofertas semilla visibles', antes, 5);

    await clicExacto(page, '+ Nueva oferta');
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[aria-label="Nombre de la oferta"]')]
        .some((i) => i.value === 'Nueva oferta'));
    ok('la oferta nueva aparece', await contarOfertas(page), 6);

    await page.evaluate(() => {
      const inp = [...document.querySelectorAll('[aria-label="Nombre de la oferta"]')]
        .find((i) => i.value === 'Nueva oferta');
      inp.closest('.vt-ficha').querySelector('[title="Borrar oferta"]').click();
    });
    await page.waitForFunction(() =>
      document.querySelectorAll('[aria-label="Nombre de la oferta"]').length === 5);
    ok('la oferta se borra', await contarOfertas(page), 5);

    // ------------------------------------- 7. Aviso en vivo entre pestañas
    seccion('La tienda y el panel se hablan en vivo');
    const tienda = await browser.newPage();
    tienda.setDefaultTimeout(12000);
    await tienda.goto(BASE + '/configurar', { waitUntil: 'domcontentloaded' });
    await esperaTexto(tienda, 'Hecho con amor en Maipú');
    await tienda.evaluate((p2) => {
      const actual = JSON.parse(localStorage.getItem('empanadas_pedidos_local') || '[]');
      localStorage.setItem('empanadas_pedidos_local', JSON.stringify([p2, ...actual]));
    }, pedido2);
    await esperaTexto(page, '1 nuevos');
    si('el panel avisa del pedido nuevo', true);
    si('el contador de nuevos marca 1',
      await page.evaluate(() => [...document.querySelectorAll('span')].some((s) => s.innerText.trim() === '1 nuevos')));
    await tienda.close();

    // ------------------------------------------------------ 8. Errores
    seccion('Errores de consola');
    ok('sin errores de JavaScript', errores.length === 0 ? 'ninguno' : errores.slice(0, 3).join(' | '), 'ninguno');
  } catch (e) {
    fallos++;
    console.log(`✗ La prueba E2E se cortó: ${e.message}`);
    if (logVite.length) console.log('— vite —\n' + logVite.join(''));
  } finally {
    if (browser) await browser.close().catch(() => {});
    servidor.kill();
  }

  console.log(fallos === 0 ? '\n✓ E2E del panel: todo OK' : `\n✗ E2E del panel: ${fallos} fallo(s)`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
