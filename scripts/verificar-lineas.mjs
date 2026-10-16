// Verificación temporal: la config de líneas se refleja en la tienda.
// Modo demo (VITE_SUPABASE_OFF=1). Desactiva la línea dulce vía overlay
// local y comprueba que aparece "Próximamente" + bloqueada en / y /configurar.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const PUERTO = Number(process.env.E2E_PORT || 5281);
const BASE = `http://localhost:${PUERTO}`;

let fallos = 0;
const ok = (n, obs, esp) => {
  const p = obs === esp;
  if (!p) fallos++;
  console.log(`${p ? '✓' : '✗'} ${n}: ${obs}${p ? '' : ` (esperado ${esp})`}`);
};
const si = (n, c) => ok(n, c ? 'si' : 'no', 'si');

function encontrarChrome() {
  const c = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  const r = c.find((x) => existsSync(x));
  if (!r) throw new Error('No encontré Chrome.');
  return r;
}

async function esperarServidor(url, ms = 45000) {
  const lim = Date.now() + ms;
  while (Date.now() < lim) {
    try { const r = await fetch(url, { redirect: 'manual' }); if (r.status < 500) return true; } catch { /* */ }
    await sleep(300);
  }
  throw new Error(`Sin servidor en ${url}`);
}

const esperaTexto = (page, txt, ms = 10000) =>
  page.waitForFunction((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), { timeout: ms }, txt);

async function main() {
  console.log('Levantando Vite en', BASE);
  const srv = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PUERTO), '--strictPort'],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, VITE_SUPABASE_OFF: '1' } });
  const logVite = [];
  srv.stdout.on('data', (d) => logVite.push(String(d)));
  srv.stderr.on('data', (d) => logVite.push(String(d)));

  let browser = null;
  try {
    await esperarServidor(BASE);
    browser = await puppeteer.launch({
      executablePath: encontrarChrome(), headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--mute-audio', '--disable-gpu'],
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);

    // ------------------------------------------ 1. Ambas líneas visibles
    console.log('\n— Estado inicial (ambas líneas activas)');
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'EMPANADAS SALADAS');
    const cuerpo = await page.evaluate(() => document.body.innerText);
    si('muestra el sello de saladas', cuerpo.includes('EMPANADAS SALADAS'));
    si('muestra el sello de dulces', cuerpo.includes('EMPANADAS DULCES'));
    const hayBloqueo = cuerpo.includes('Bloqueada') || cuerpo.includes('Próximamente');
    ok('no hay líneas bloqueadas al inicio', hayBloqueo, false);

    // ------------------------------------------ 2. Desactivar línea dulce
    console.log('\n— Desactivar la línea dulce en config (overlay local)');
    await page.evaluate(() => {
      const KEY = 'empanadas_admin_local';
      const actual = JSON.parse(localStorage.getItem(KEY) || '{}');
      const settings = { ...(actual.settings || {}), lineas: { ...((actual.settings || {}).lineas || {}), dulce: { ...(((actual.settings || {}).lineas || {}).dulce || {}), activa: false } } };
      localStorage.setItem(KEY, JSON.stringify({ ...actual, settings }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'EMPANADAS DULCES');
    const despues = (await page.evaluate(() => document.body.innerText)).toLowerCase();
    si('la línea dulce sigue visible (no desaparece)', despues.includes('empandas dulces') || despues.includes('empanadas dulces'));
    si('aparece el sello Próximamente', despues.includes('próximamente'));
    si('aparece el aviso Bloqueada', despues.includes('bloqueada'));

    // El sello de dulces debe estar deshabilitado (div, no button) → bloqueado
    const dulceBloqueada = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'EMPANADAS DULCES');
      if (!el) return false;
      const sello = el.closest('[aria-disabled], button');
      if (!sello) return false;
      return sello.getAttribute('aria-disabled') === 'true' || sello.tagName !== 'BUTTON';
    });
    si('el sello de dulces está bloqueado (no clicable)', dulceBloqueada);

    // ------------------------------------------ 3. /configurar?linea=dulce bloqueado
    console.log('\n— Ir al armador de la línea dulce desactivada');
    await page.goto(BASE + '/configurar?linea=dulce', { waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'Próximamente');
    const armador = await page.evaluate(() => document.body.innerText);
    si('el armador muestra Próximamente', armador.includes('Próximamente'));
    si('el armador indica línea pausada', /pausada|preparando/i.test(armador));
    const noBuilder = await page.evaluate(() => !document.body.innerText.includes('Elige tu relleno'));
    si('no muestra el builder de la línea apagada', noBuilder);

    // ------------------------------------------ 4. Salada sigue funcionando
    console.log('\n— La línea salada sigue activa');
    await page.goto(BASE + '/configurar?linea=salada', { waitUntil: 'domcontentloaded' });
    await esperaTexto(page, 'Elige tu proteína');
    si('el armador salada carga el builder', true);

    // ------------------------------------------ 5. Restaurar
    await page.evaluate(() => localStorage.removeItem('empanadas_admin_local'));

    console.log(fallos === 0 ? '\n✓ Reflejo de config en tienda: todo OK' : `\n✗ ${fallos} fallo(s)`);
    process.exit(fallos === 0 ? 0 : 1);
  } catch (e) {
    fallos++;
    console.log(`✗ Se cortó: ${e.message}`);
    if (logVite.length) console.log('— vite —\n' + logVite.join(''));
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => {});
    srv.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
