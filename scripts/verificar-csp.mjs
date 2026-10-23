import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(raiz, 'dist')
const vercel = JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8'))
const headersVercel = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json'
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  let archivo = path.join(dist, decodeURIComponent(url.pathname))
  if (!archivo.startsWith(dist)) return res.writeHead(403).end()
  if (!fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
    archivo = path.join(dist, 'index.html') // rewrite SPA de vercel.json
  }
  for (const [k, v] of Object.entries(headersVercel)) res.setHeader(k, v)
  res.setHeader('Content-Type', MIME[path.extname(archivo)] || 'application/octet-stream')
  res.end(fs.readFileSync(archivo))
})

const encontrarChrome = () =>
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome'
  ].find((p) => fs.existsSync(p))

const fallos = []
const avisos = []

const browser = await puppeteer.launch({
  executablePath: encontrarChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
})

try {
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok))
  const puerto = servidor.address().port
  const base = `http://127.0.0.1:${puerto}`

  const rutas = ['/', '/configurar', '/admin']
  for (const ruta of rutas) {
    const pagina = await browser.newPage()
    const problemas = []
    pagina.on('console', (m) => {
      const t = m.text()
      if (/Content Security Policy|Refused to|violated/i.test(t)) problemas.push(`CSP: ${t}`)
    })
    pagina.on('pageerror', (e) => problemas.push(`pageerror: ${e.message}`))

    const resp = await pagina.goto(base + ruta, { waitUntil: 'networkidle2', timeout: 30000 })
    const csp = resp.headers()['content-security-policy']
    if (csp !== headersVercel['Content-Security-Policy']) {
      fallos.push(`${ruta}: respuesta sin CSP de vercel.json (status ${resp.status()})`)
    }
    const raizDom = await pagina.evaluate(() => document.getElementById('root')?.children.length || 0)
    if (raizDom === 0) fallos.push(`${ruta}: #root vacío (SPA rewrite falló)`)
    if (problemas.length) fallos.push(...problemas.map((p) => `${ruta}: ${p}`))

    if (ruta === '/') {
      const fuentes = await pagina.evaluate(async () => {
        await document.fonts.ready
        return document.fonts.size
      })
      if (fuentes === 0) avisos.push('Google Fonts: document.fonts vacío')
      const imgsRotos = await pagina.evaluate(() =>
        [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length
      )
      if (imgsRotos > 0) avisos.push(`imágenes rotas en home: ${imgsRotos}`)
    }
    console.log(`${ruta} → status ${resp.status()}, DOM ${raizDom} nodo(s), CSP presente, ${problemas.length} violación(es)`)
    await pagina.close()
  }
} finally {
  await browser.close()
  servidor.close()
}

for (const a of avisos) console.log(`aviso: ${a}`)
if (fallos.length) {
  console.error(`\nFALLÓ (${fallos.length}):`)
  for (const f of fallos) console.error(` - ${f}`)
  process.exit(1)
}
console.log('\nCSP + headers + SPA rewrite verificados en /, /configurar y /admin')
