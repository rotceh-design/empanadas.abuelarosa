import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  isSupabaseConfigured,
  suscribirTabla, mapIngredient, mapDrink, mapOffer, mapRule, mapBadge, mapStats, mapSettings,
} from '../lib/supabase';
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
  const [fuente, setFuente] = useState(isSupabaseConfigured ? 'cargando' : 'local');
  const [overlay, setOverlay] = useState(() => (isSupabaseConfigured ? null : leerOverlayInicial()));

  useEffect(() => {
    if (isSupabaseConfigured) return undefined;
    return suscribirOverlay((ov) => setOverlay({ ...ov }));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const sinDatos = () => setFuente('local');

    const unsubs = [
      suscribirTabla({
        tabla: 'ingredients', mapa: mapIngredient,
        onChange: (lista) => {
          if (!lista.length) return;
          setIngredientes(lista);
          setFuente('supabase');
        },
        onErr: sinDatos,
      }),
      suscribirTabla({
        tabla: 'drinks', mapa: mapDrink, ordenarPor: 'orden',
        onChange: (lista) => { if (lista.length) setBebidas(lista); },
      }),
      suscribirTabla({
        tabla: 'offers', mapa: mapOffer, ordenarPor: 'orden',
        onChange: (lista) => { if (lista.length) setOfertas(lista); },
      }),
      suscribirTabla({
        tabla: 'settings', unaFila: true, idFila: 'main', mapa: mapSettings,
        onChange: (data) => { if (data) setSettings({ ...SETTINGS_SEED, ...data }); },
      }),
      suscribirTabla({
        tabla: 'rules', mapa: mapRule,
        onChange: (lista) => { if (lista.length) setReglas(lista); },
      }),
      suscribirTabla({
        tabla: 'badges', mapa: mapBadge,
        onChange: (lista) => { if (lista.length) setInsignias(lista); },
      }),
      suscribirTabla({
        tabla: 'stats', mapa: mapStats,
        onChange: (lista) => {
          const s = {};
          lista.forEach((r) => { s[r.id] = r; });
          setStats(s);
        },
      }),
    ];

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
    const cantDulce = conf?.lineas?.dulce?.cantidadAcompanamientos ?? 4;

    const saladaActiva = conf?.lineas?.salada?.activa !== false;
    const dulceActiva = Boolean(conf?.lineas?.dulce?.activa);

    // Ambas líneas con su flag `activa`, para que la tienda las muestre
    // aunque estén apagadas (como "Próximamente" y bloqueadas).
    const lineasTodas = [
      {
        id: 'salada', nombre: 'Salada', activa: saladaActiva, ...salada,
        cantidadAcompanamientos: 4,
        total: totalCombinaciones({ ...salada, cantidadAcompanamientos: 4 }),
      },
      {
        id: 'dulce', nombre: 'Dulce', activa: dulceActiva, ...dulce,
        quesos: salada.quesos,
        cantidadAcompanamientos: cantDulce,
        total: totalCombinaciones({ ...dulce, quesos: salada.quesos, cantidadAcompanamientos: cantDulce }),
      },
    ];
    // Solo las activas: alimenta precios, daily, ruleta y el builder.
    const lineas = lineasTodas.filter((l) => l.activa);

    const porId = Object.fromEntries(ings.map((i) => [i.id, i]));
    const bebidasTodas = ordenar(bebs);
    const bebidasDisp = bebidasTodas.filter((b) => b.disponible !== false);

    return {
      ingredientes: ings, porId, bebidas: bebidasDisp, bebidasTodas,
      ofertas: ordenar(base.ofertas), settings: conf, reglas: base.reglas, insignias, stats,
      lineas, lineasTodas, fuente,
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
