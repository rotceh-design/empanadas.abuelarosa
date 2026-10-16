// ============================================
// SEED → FIRESTORE
// Sube el catálogo inicial a Firestore.
// Uso:  node scripts/seed.mjs
// Requiere: FIREBASE_SERVICE_ACCOUNT (ruta al JSON de servicio)
// ============================================
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { CATALOGO_SEED, BEBIDAS_SEED, OFERTAS_SEED, SETTINGS_SEED, REGLAS_SEED, INSIGNIAS_SEED } from '../src/data/catalogoSeed.js';

const cuenta = process.env.FIREBASE_SERVICE_ACCOUNT;

const app = initializeApp({
  credential: cuenta
    ? cert(JSON.parse(readFileSync(cuenta, 'utf8')))
    : applicationDefault(),
});

const db = getFirestore(app);

async function subir(coleccion, items) {
  const lote = db.batch();
  items.forEach((item) => {
    const { id, ...data } = item;
    lote.set(db.collection(coleccion).doc(id), data, { merge: true });
  });
  await lote.commit();
  console.log(`✓ ${coleccion}: ${items.length} docs`);
}

// IDs que ya no existen en el catálogo (se borran para que no aparezcan en la tienda)
const OBSOLETOS = {
  ingredients: [
    'p_soya', 'd_queso', 'd_arandano',
    'd_pinon', 'd_piura', 'd_dulceleche', 'd_llanero', 'd_ahumado', 'd_azucar', 'd_canela',
  ],
};

async function main() {
  await subir('ingredients', CATALOGO_SEED);
  await subir('drinks', BEBIDAS_SEED);
  await subir('offers', OFERTAS_SEED);
  await subir('rules', REGLAS_SEED);
  await subir('badges', INSIGNIAS_SEED);

  for (const [coleccion, ids] of Object.entries(OBSOLETOS)) {
    for (const id of ids) {
      await db.collection(coleccion).doc(id).delete().catch(() => {});
      console.log(`✓ eliminado ${coleccion}/${id}`);
    }
  }

  await db.collection('settings').doc('main').set(SETTINGS_SEED, { merge: true });
  console.log('✓ settings/main');

  await db.collection('counters').doc('orders').set({ valor: 100 }, { merge: true });
  await db.collection('counters').doc('combinaciones').set({ valor: 0 }, { merge: true });
  console.log('✓ counters');

  console.log('\n🎉 Seed completado.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
