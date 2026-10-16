import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  CATALOGO_SEED, BEBIDAS_SEED, OFERTAS_SEED, SETTINGS_SEED,
  REGLAS_SEED, INSIGNIAS_SEED,
} from '../data/catalogoSeed';
import { totalCombinaciones } from '../lib/nombres';
import { aplicarOverlay, suscribirOverlay, leerOverlayInicial } from '../lib/inventario';

const CatalogContext = createContext(null);

const local = {
  ingredientes: CATALOGO_SEED,
  bebidas: BEBIDAS_SEED,
  ofertas: OFERTAS_SEED,
  settings: SETTINGS_SEED,
  reglas: REGLAS_SEED,
  insignias: INSIGNIAS_SEED,
};

function ordenar(list, campo = 'orden') {
  return [...list].sort((a, b) => (a[campo] || 0) - (b[campo] || 0));
}

export function CatalogProvider({ children }) {
  const [ingredientes, setIngredientes] = useState(local.ingredientes);
  const [bebidas, setBebidas] = useState(local.bebidas);
  const [ofertas, setOfertas] = useState(local.ofertas);
  const [settings, setSettings] = useState(local.settings);
  const [reglas, setReglas] = useState(local.reglas);
  const [insignias, setInsignias] = useState(local.insignias);
  const [stats, setStats] = useState({});
  const [fuente, setFuente] = useState(isFirebaseConfigured ? 'cargando' : 'local');
  const [overlay, setOverlay] = useState(() => (isFirebaseConfigured ? null : leerOverlayInicial()));

  useEffect(() => {
    if (isFirebaseConfigured) return undefined;
    return suscribirOverlay((ov) => setOverlay({ ...ov }));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    const unsubs = [];
    try {
      unsubs.push(onSnapshot(collection(db, 'ingredients'), (snap) => {
        if (snap.empty) return;
        setIngredientes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFuente('firestore');
      }, () => setFuente('local')));

      unsubs.push(onSnapshot(collection(db, 'drinks'), (snap) => {
        if (!snap.empty) setBebidas(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.orden - b.orden));
      }, () => {}));

      unsubs.push(onSnapshot(collection(db, 'offers'), (snap) => {
        if (!snap.empty) setOfertas(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.orden - b.orden));
      }, () => {}));

      unsubs.push(onSnapshot(doc(db, 'settings', 'main'), (snap) => {
        if (snap.exists()) setSettings({ ...SETTINGS_SEED, ...snap.data() });
      }, () => {}));

      unsubs.push(onSnapshot(collection(db, 'rules'), (snap) => {
        if (!snap.empty) setReglas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {}));

      unsubs.push(onSnapshot(collection(db, 'badges'), (snap) => {
        if (!snap.empty) setInsignias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {}));

      unsubs.push(onSnapshot(collection(db, 'stats'), (snap) => {
        const s = {};
        snap.docs.forEach((d) => { s[d.id] = d.data(); });
        setStats(s);
      }, () => {}));
    } catch {
      setFuente('local');
    }
    return () => unsubs.forEach((u) => u());
  }, []);

  const value = useMemo(() => {
    const base = overlay
      ? aplicarOverlay({ ingredientes, bebidas, settings, ofertas, reglas }, overlay)
      : { ingredientes, bebidas, settings, ofertas, reglas };
    const ings = base.ingredientes;
    const bebs = base.bebidas;
    const conf = base.settings;
    const porLinea = (linea) => {
      const lista = ings.filter((i) => i.linea === linea && i.disponible !== false);
      return {
        proteinas: ordenar(lista.filter((i) => i.categoria === 'proteina')),
        quesos: ordenar(lista.filter((i) => i.categoria === 'queso')),
        acompanamientos: ordenar(lista.filter((i) => i.categoria === 'acompanamiento')),
      };
    };
    const salada = porLinea('salada');
    const dulce = porLinea('dulce');
    const cantDulce = conf?.lineas?.dulce?.cantidadAcompanamientos ?? 1;

    const lineas = [];
    if (conf?.lineas?.salada?.activa !== false) {
      lineas.push({ id: 'salada', nombre: 'Salada', ...salada, cantidadAcompanamientos: 4, total: totalCombinaciones({ ...salada, cantidadAcompanamientos: 4 }) });
    }
    if (conf?.lineas?.dulce?.activa) {
      lineas.push({
        id: 'dulce', nombre: 'Dulce', ...dulce,
        quesos: salada.quesos,
        cantidadAcompanamientos: cantDulce,
        total: totalCombinaciones({ ...dulce, quesos: salada.quesos, cantidadAcompanamientos: cantDulce }),
      });
    }

    const porId = Object.fromEntries(ings.map((i) => [i.id, i]));
    const bebidasTodas = ordenar(bebs);
    const bebidasDisp = bebidasTodas.filter((b) => b.disponible !== false);

    return {
      ingredientes: ings, porId, bebidas: bebidasDisp, bebidasTodas,
      ofertas: ordenar(base.ofertas), settings: conf, reglas: base.reglas, insignias, stats,
      lineas, fuente,
      precioBase: conf?.precios?.empanadaBase ?? 2990,
      precios: conf?.precios ?? SETTINGS_SEED.precios,
      whatsapp: conf?.negocio?.whatsapp ?? SETTINGS_SEED.negocio.whatsapp,
      resaltar: (id) => porId[id]?.emoji || '✨',
    };
  }, [ingredientes, bebidas, ofertas, settings, reglas, insignias, stats, fuente, overlay]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog debe usarse dentro de CatalogProvider');
  return ctx;
}
