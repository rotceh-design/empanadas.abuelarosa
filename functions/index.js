const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Recomendación de empanadas vía Claude (Anthropic).
// La API key NUNCA va en el frontend: se guarda como secreto de Cloud Functions.
//   firebase functions:secrets:set ANTHROPIC_API_KEY
//
// Fallback: si la IA falla o no está configurada, usa reglas locales.

exports.recomendar = functions.https.onCall(async (data, _context) => {
  const { vegetariana, favorito, picante } = data || {};

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ingredientes = await cargarCatalogo();

  if (!apiKey) {
    return { fuente: 'reglas', opciones: reglasLocales({ vegetariana, favorito, picante, ingredientes }) };
  }

  try {
    const prompt = construirPrompt({ vegetariana, favorito, picante, ingredientes });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) throw new Error(`Anthropic ${resp.status}`);
    const json = await resp.json();
    const texto = json.content?.[0]?.text || '';
    const opciones = parsear(texto, ingredientes);
    if (!opciones.length) throw new Error('Respuesta vacía');
    return { fuente: 'ia', opciones };
  } catch (e) {
    console.warn('IA no disponible, usando reglas:', e.message);
    return { fuente: 'reglas', opciones: reglasLocales({ vegetariana, favorito, picante, ingredientes }) };
  }
});

async function cargarCatalogo() {
  const snap = await db.collection('ingredients').where('disponible', '!=', false).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function construirPrompt({ vegetariana, favorito, picante, ingredientes }) {
  const porCat = (c) => ingredientes.filter((i) => i.categoria === c).map((i) => i.nombre);
  return [
    'Eres un chef chileno que arma empanadas personalizadas.',
    'Devuelve exactamente 3 combinaciones en JSON con esta forma:',
    '{"opciones":[{"nombre":"...","proteina":"...","queso":"...","acompanamientos":["...","...","...","..."],"descripcion":"..."}]}',
    `Proteínas disponibles: ${porCat('proteina').join(', ')}`,
    `Quesos disponibles: ${porCat('queso').join(', ')}`,
    `Acompañamientos disponibles: ${porCat('acompanamiento').join(', ')}`,
    `Preferencias del cliente: vegetariana=${vegetariana}, sabor favorito=${favorito || 'no specify'}, picante=${picante}`,
    'Cada empanada lleva 1 proteína, 1 queso y exactamente 4 acompañamientos sin repetir.',
  ].join('\n');
}

function parsear(texto, ingredientes) {
  const m = texto.match(/\{[\s\S]*\}/);
  if (!m) return [];
  try {
    const json = JSON.parse(m[0]);
    return (json.opciones || []).slice(0, 3).map((o) => ({
      ...o,
      proteinaId: ingredientes.find((i) => i.nombre === o.proteina)?.id,
      quesoId: ingredientes.find((i) => i.nombre === o.queso)?.id,
      acompanamientosIds: (o.acompanamientos || []).map((n) => ingredientes.find((i) => i.nombre === n)?.id).filter(Boolean),
    }));
  } catch { return []; }
}

function reglasLocales({ vegetariana, favorito, picante, ingredientes }) {
  const porCat = (c) => ingredientes.filter((i) => i.categoria === c);
  let proteinas = porCat('proteina');
  let quesos = porCat('queso');
  let acmps = porCat('acompanamiento');

  if (vegetariana) {
    proteinas = proteinas.filter((p) => p.tags?.includes('vegana'));
    quesos = quesos.filter((q) => q.tags?.includes('vegano') || !q.tags?.length);
    acmps = acmps.filter((a) => a.tags?.includes('vegetal'));
  }
  if (picante === false) acmps = acmps.filter((a) => !a.tags?.includes('picante'));
  if (picante === true) {
    const picantes = acmps.filter((a) => a.tags?.includes('picante'));
    acmps = [...picantes, ...acmps.filter((a) => !a.tags?.includes('picante'))];
  }
  if (favorito) {
    const f = favorito.toLowerCase();
    acmps = [...acmps.filter((a) => a.nombre.toLowerCase().includes(f)), ...acmps.filter((a) => !a.nombre.toLowerCase().includes(f))];
  }

  const semilla = (favorito || '').length + (vegetariana ? 3 : 0) + (picante ? 1 : 0);
  const opciones = [];
  for (let k = 0; k < 3; k++) {
    const p = proteinas[(semilla + k) % proteinas.length];
    const q = quesos[(semilla + k) % quesos.length];
    const a = [];
    for (let i = 0; i < 4; i++) a.push(acmps[(semilla + k * 2 + i * 3) % acmps.length]);
    const unicos = [...new Map(a.filter(Boolean).map((x) => [x.id, x])).values()];
    opciones.push({
      nombre: `La sugerencia ${k + 1}`,
      proteina: p?.nombre, queso: q?.nombre,
      acompanamientos: unicos.map((x) => x.nombre),
      proteinaId: p?.id, quesoId: q?.id,
      acompanamientosIds: unicos.map((x) => x.id),
      descripcion: 'Elegida por nuestro chef automático',
    });
  }
  return opciones;
}
