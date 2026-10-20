import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCatalog } from '../contexts/CatalogContext';
import { useCart } from '../contexts/CartContext';
import { usePlayer } from '../contexts/PlayerContext';
import Ruleta from '../components/builder/Ruleta';
import { Etiqueta } from '../components/ui';
import { IconoIngrediente, IconoCarne, IconoQuesoWedge, IconoLata, IconoCandado } from '../components/Iconos';
import { fmtCLP } from '../lib/formato';
import { desgloseEmpanada, aporteIngrediente } from '../lib/precios';
import FichaEmpanada from '../components/FichaEmpanada';
import { calcularEtiquetas } from '../lib/etiquetas';
import { generarNombre, claveCombinacion } from '../lib/nombres';
import { play } from '../lib/sonidos';
import { getEnvio } from '../lib/envio';
import { crearPedido, diasProduccion } from '../lib/pedidos';
import { enviarPedidoWhatsApp } from '../lib/ticket';
import ModalPago from '../components/vintage/ModalPago';

const MENSAJES_SALADA = [
  'Misión iniciada: elige tu proteína 🎯',
  'Combo encadenado 🔥',
  'Casi completas la receta',
  '¡Sube el volumen con extras!',
  '¡Receta lista para la freidora! 🎉',
];

const MENSAJES_DULCE = [
  'Misión iniciada: elige tu relleno 🎯',
  'Elige tu queso dulce 🧀',
  'Un toque dulce para rematar ✨',
  '¡Dulce lista para la freidora! 🎉',
];

const PASOS_SALADA = ['proteina', 'queso', 'acamps', 'extras', 'resumen'];
const PASOS_DULCE = ['relleno', 'queso', 'extra', 'resumen'];

export default function Armar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lineas, lineasTodas, precios, settings, bebidas: catalogoBebidas } = useCatalog();
  const { agregarEmpanada, agregarBebida, empanadas, bebidas, resumen, vaciar } = useCart();
  const { registrarEmpanada, registrarPedido } = usePlayer();

  const [lineaId, setLineaId] = useState(() => {
    const q = searchParams.get('linea');
    if (q && lineasTodas.some((l) => l.id === q)) return q;
    return lineas[0]?.id || 'salada';
  });
  const linea = lineasTodas.find((l) => l.id === lineaId) || lineasTodas[0];
  const lineaActiva = linea?.activa !== false;
  const esDulce = lineaId === 'dulce';
  const cantAcomp = linea?.cantidadAcompanamientos ?? 4;
  const pasos = esDulce ? PASOS_DULCE : PASOS_SALADA;
  const mensajes = esDulce ? MENSAJES_DULCE : MENSAJES_SALADA;
  const totalPasos = pasos.length;

  const [paso, setPaso] = useState(0);
  const pasoActual = pasos[Math.min(paso, totalPasos - 1)];
  const [proteina, setProteina] = useState(null);
  const [queso, setQueso] = useState(null);
  const [acomps, setAcomps] = useState([]);
  const [extras, setExtras] = useState({ proteina: false, queso: false, acomp: [] });
  const [ruletaAbierta, setRuletaAbierta] = useState(false);
  const [dieta, setDieta] = useState('todas');
  const [bloqueos, setBloqueos] = useState([]);
  const [modalPago, setModalPago] = useState(false);
  const [enviandoPago, setEnviandoPago] = useState(false);

  const acamps = useMemo(() => acampsObtener(acomps, linea), [acomps, linea]);

  const etiquetasInfo = useMemo(() => {
    if (esDulce) return { etiquetas: [], esVegana: false, esVegetariana: false };
    return calcularEtiquetas({ proteina, queso, acompanamientos: acamps });
  }, [esDulce, proteina, queso, acamps]);

  const nombreAuto = useMemo(() => {
    if (!proteina || !queso) return '';
    return generarNombre({ proteina, queso });
  }, [proteina, queso]);

  const nombreFinal = nombreAuto;

  const extrasCount = (extras.proteina ? 1 : 0) + (extras.queso ? 1 : 0) + extras.acomp.length;

  // Desglose completo: de dónde sale cada peso del precio final.
  const desglose = useMemo(() => {
    const minAcomp = esDulce ? 0 : 1;
    const faltan = !esDulce && proteina && queso ? Math.max(0, minAcomp - acamps.length) : 0;
    return desgloseEmpanada(
      { proteina, queso, acompanamientos: acamps },
      { precios, lineas: settings?.lineas },
      extras,
      faltan,
      lineaId,
    );
  }, [esDulce, proteina, queso, acamps, extras, precios, settings, lineaId]);

  const precio = desglose.total;

  const maxExtras = precios.maxExtrasPorEmpanada ?? 2;

  const pasoValido = () => {
    if (pasoActual === 'relleno') return Boolean(proteina);
    if (pasoActual === 'proteina') return Boolean(proteina);
    if (pasoActual === 'queso') return Boolean(queso);
    if (pasoActual === 'acamps') return acamps.length >= 1;
    return true;
  };

  const toggleAcomp = (ing) => {
    setAcomps((prev) => {
      if (prev.find((x) => x.id === ing.id)) { play('tick'); return prev.filter((x) => x.id !== ing.id); }
      if (cantAcomp === 1) { play('pop'); return [ing]; }
      if (prev.length >= cantAcomp) return prev;
      play('pop');
      return [...prev, ing];
    });
  };

  const aplicarRuleta = ({ proteina: p, queso: q, acompanamientos: a, dieta: d, bloqueo: b, linea: l, cantidad }) => {
    if (d !== undefined) { setDieta(d); return; }
    if (b !== undefined) {
      setBloqueos((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
      return;
    }
    if (l && l !== lineaId) cambiarLinea(l);
    play('win');
    setProteina(p);
    setQueso(q);
    setAcomps((a || []).slice(0, cantidad ?? cantAcomp));
    setPaso(0);
  };

  const itemActual = useMemo(() => {
    if (!proteina || !queso) return null;
    return {
      linea: lineaId,
      nombre: nombreFinal || 'Mi empanada',
      proteinaId: proteina.id,
      quesoId: queso?.id ?? null,
      acompanamientosIds: acamps.map((a) => a.id),
      proteina: proteina.nombre,
      queso: queso?.nombre ?? null,
      acompanamientos: acamps.map((a) => a.nombre),
      emojis: [proteina.emoji, queso?.emoji, ...acamps.map((a) => a.emoji)].filter(Boolean),
      colores: [proteina.color, queso?.color, ...acamps.map((a) => a.color)].filter(Boolean),
      extras,
      extrasCount,
      extrasPrecio: precio - precios.empanadaBase,
      etiquetas: etiquetasInfo.etiquetas.map((e) => e.id),
      precioUnitario: precio,
      clave: claveCombinacion({ proteina, queso, acompanamientos: acamps }),
    };
  }, [proteina, queso, acamps, nombreFinal, extras, extrasCount, precio, precios.empanadaBase, etiquetasInfo, lineaId]);

  const alCarrito = () => {
    if (!itemActual) return;
    registrarEmpanada(itemActual);
    agregarEmpanada(itemActual);
    // "Agregar otra" → vuelve a la selección salada/dulce SIN pedir datos de envío de nuevo
    navigate('/');
  };

  const pagar = () => {
    if (!itemActual) return;
    // Valida datos de envío guardados; si faltan, va al formulario una vez
    const envio = getEnvio();
    if (!envio?.nombre || !envio?.telefono || !envio?.direccion) {
      registrarEmpanada(itemActual);
      agregarEmpanada(itemActual);
      navigate(`/envio?linea=${lineaId}`);
      return;
    }
    registrarEmpanada(itemActual);
    agregarEmpanada(itemActual);
    setModalPago(true);
  };

  const confirmarPago = async () => {
    const envio = getEnvio();
    if (!envio || enviandoPago) return;
    setEnviandoPago(true);
    try {
      const dias = diasProduccion(settings?.produccion?.diasHabilitados);
      const fechaSel = dias[0]?.fecha || 'A coordinar';
      const horaSel = settings?.produccion?.horas?.[0] || 'A coordinar';
      const comunasGratis = settings?.delivery?.comunasGratis || [];
      const gratisDesde = settings?.delivery?.gratisDesdeEmpanadas ?? 2;
      const enZona = comunasGratis.includes(envio.comuna);
      const cumpleMinimo = resumen.totalEmpanadas >= gratisDesde;
      const delivery = enZona && cumpleMinimo ? 0 : (settings?.delivery?.costo ?? 1000);
      const total = resumen.total + delivery;
      const items = [
        ...empanadas.map((e) => ({ ...e, tipo: 'empanada' })),
        ...bebidas.map((b) => ({
          tipo: 'bebida', id: b.id, nombre: b.nombre, emoji: b.emoji,
          cantidad: b.cantidad, precio: b.precio,
        })),
      ];
      const pedido = {
        items,
        cliente: { ...envio },
        entrega: { fecha: fechaSel, hora: horaSel },
        totales: { subtotal: resumen.total + resumen.ahorro, ahorro: resumen.ahorro, delivery, total },
        oferta: { ahorro: resumen.ahorro, detalle: resumen.detalle || [] },
        etiquetas: [...new Set(empanadas.flatMap((e) => e.etiquetas || []))],
        comprobante: null,
        fuente: 'web',
      };
      const creado = await crearPedido(pedido);
      const completo = { ...pedido, numero: creado.numero, id: creado.id };
      registrarPedido(pedido);
      const r = await enviarPedidoWhatsApp({ pedido: completo });
      vaciar();
      navigate('/ticket', { state: { pedido: completo, envio: r }, replace: true });
    } finally {
      setEnviandoPago(false);
      setModalPago(false);
    }
  };

  const ruletaAplicar = useMemo(() => {
    const f = (ing) => {
      if (dieta === 'vegana') return ing.tags?.includes('vegano') || ing.tags?.includes('vegana') || ing.tags?.includes('vegetal');
      if (dieta === 'vegetariana') return !ing.tags?.some((t) => t === 'pescado' || t === 'marisco');
      return true;
    };
    return {
      actual: lineaId,
      cantidadAcompanamientos: cantAcomp,
      lineas: (lineas || []).map((l) => ({
        id: l.id,
        proteinas: l.proteinas.filter(f),
        quesos: l.quesos.filter(f),
        acompanamientos: l.acompanamientos.filter(f),
        cantidad: l.cantidadAcompanamientos ?? 4,
      })),
    };
  }, [lineas, dieta, lineaId, cantAcomp]);

  if (!linea) return <div className="p-8 text-center">Cargando catálogo…</div>;

  const cambiarLinea = (id) => {
    setLineaId(id);
    setProteina(null);
    setQueso(null);
    setAcomps([]);
    setExtras({ proteina: false, queso: false, acomp: [] });
    setPaso(0);
  };

  const pasoPenultimo = paso === totalPasos - 2;

  return (
    <div className="vt-papel vt-tinta mx-auto min-h-screen max-w-3xl px-4 pb-32 pt-4">
      {/* Pestañas de línea */}
      {lineasTodas.length > 1 && (
        <div className="mb-3 flex gap-2">
          {lineasTodas.map((l) => (
            <button
              key={l.id}
              onClick={() => cambiarLinea(l.id)}
              className={`btn-tap vt-serif flex-1 rounded-full border-2 px-4 py-3 text-sm font-bold uppercase tracking-wide ${
                lineaId === l.id
                  ? 'vt-pestana-activa'
                  : 'vt-botones bg-transparent'
              } ${l.activa ? '' : 'opacity-60'}`}
            >
              {l.nombre}{l.activa ? '' : ' · Próximamente'}
            </button>
          ))}
        </div>
      )}

      {/* Línea apagada en config: bloqueada, sin builder */}
      {!lineaActiva && (
        <div className="vt-sello mt-6 flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
          <IconoCandado size={44} />
          <h2 className="vt-titulo text-2xl">Línea {linea.nombre} — Próximamente</h2>
          <p className="vt-cuerpo mx-auto max-w-sm text-sm italic opacity-75">
            Esta línea está pausada por ahora. Estamos preparándola para ti; vuelve pronto.
          </p>
          {lineas.length > 0 && (
            <button
              onClick={() => cambiarLinea(lineas[0].id)}
              className="vt-btn btn-tap mt-2 rounded-full px-6 py-3 text-sm"
            >
              Ir a la línea {lineas[0].nombre} →
            </button>
          )}
        </div>
      )}

      {/* Ficha de ingredientes (HUD) */}
      {lineaActiva && (<>
      <div className="sticky top-[104px] z-30 -mx-4 bg-[#f3e6c8]/92 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <FichaIngredientes
              proteina={proteina}
              queso={queso}
              acompanamientos={acamps}
              esDulce={esDulce}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="vt-serif rounded-full border border-[#4a2c17]/40 bg-[#4a2c17]/10 px-2 py-px text-[10px] font-bold uppercase tracking-widest text-[#4a2c17]">
                Paso {Math.min(paso + 1, totalPasos)}/{totalPasos}
              </span>
              <span className="vt-cuerpo text-[11px] italic opacity-60">{Math.round(((paso + 1) / totalPasos) * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full border border-[#4a2c17]/25 bg-[#4a2c17]/8">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#8b4513] to-[#c49a6c]"
                animate={{ width: `${((paso + 1) / totalPasos) * 100}%` }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
              />
            </div>
            <p className="vt-serif mt-1.5 text-base font-bold uppercase tracking-wide leading-tight">
              {mensajes[Math.min(paso, mensajes.length - 1)]}
            </p>
            <p className="vt-cuerpo text-xs italic opacity-60">
              Paso {paso + 1} de {totalPasos}
              {proteina && ` · ${proteina.nombre}`}
              {queso && ` · ${queso.nombre}`}
              {acamps.length > 0 && ` · ${acamps.length}/${cantAcomp} ${esDulce ? 'extra' : 'acompañamientos'}`}
            </p>
          </div>
          <button
            onClick={() => setRuletaAbierta(true)}
            className="vt-btn btn-tap flex-shrink-0 rounded-xl px-3 py-3 text-center text-xs"
            title="Sorpréndeme"
          >
            Sorpréndeme
          </button>
        </div>
      </div>

      {/* Contenido del paso */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${lineaId}-${paso}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
          className="mt-4"
        >
          {pasoActual === 'relleno' && (
            <PasoGrid
              titulo="Elige tu relleno"
              sub="Solo 1 — el alma de tu dulce"
              items={linea.proteinas}
              seleccionados={proteina ? [proteina.id] : []}
              onToggle={(ing) => { setProteina(ing); play('select'); }}
              max={1}
            />
          )}

          {pasoActual === 'extra' && (
            <div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="vt-titulo text-xl">¿Un toque dulce?</h2>
                  <p className="text-sm opacity-70">Opcional — hasta {cantAcomp} ({acomps.length}/{cantAcomp})</p>
                </div>
                {acomps.length === 0 && (
                  <button
                    onClick={() => { play('ok'); setPaso((p) => p + 1); }}
                    className="vt-btn-fantasma btn-tap rounded-full px-3 py-1.5 text-xs"
                  >
                    Continuar sin extra →
                  </button>
                )}
              </div>

              <PasoGrid
                items={linea.acompanamientos}
                seleccionados={acomps.map((a) => a.id)}
                onToggle={toggleAcomp}
                max={cantAcomp}
                compact
              />
            </div>
          )}

          {pasoActual === 'proteina' && (
            <PasoGrid
              titulo="Elige tu proteína"
              sub="Solo 1 — es el alma de tu empanada"
              items={linea.proteinas}
              seleccionados={proteina ? [proteina.id] : []}
              onToggle={(ing) => { setProteina(ing); play('select'); }}
              max={1}
            />
          )}

          {pasoActual === 'queso' && (
            <PasoGrid
              titulo={esDulce ? 'Elige tu queso dulce' : 'Elige tu queso'}
              sub={esDulce ? 'Solo 1 — gouda, llanero, vegano o mozzarella' : 'Solo 1 — el que derrite corazón'}
              items={linea.quesos}
              seleccionados={queso ? [queso.id] : []}
              onToggle={(ing) => { setQueso(ing); play('select'); }}
              max={1}
            />
          )}

          {pasoActual === 'acamps' && (
            <div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="font-display text-xl font-extrabold">Elige hasta {cantAcomp} acompañamientos</h2>
                  <p className="text-sm opacity-70">Sin repetir — llevas {acomps.length}/{cantAcomp} · mínimo 1</p>
                </div>
                <button
                  onClick={() => setAcomps(linea.acompanamientos.slice(0, cantAcomp))}
                  className="vt-btn-fantasma btn-tap rounded-full px-3 py-1.5 text-xs"
                >
                  Rellenar
                </button>
              </div>

              <PasoGrid
                items={linea.acompanamientos}
                seleccionados={acomps.map((a) => a.id)}
                onToggle={toggleAcomp}
                max={cantAcomp}
                compact
              />
            </div>
          )}

          {pasoActual === 'extras' && (
            <div>
              <h2 className="font-display text-xl font-extrabold">¿Le subimos el volumen? 🔊</h2>
              <p className="mb-3 text-sm opacity-70">Opcional — hasta {maxExtras} extras ({extrasCount}/{maxExtras})</p>

              <div className="grid grid-cols-2 gap-3">
                <ExtraCard
                  icono={<IconoCarne size={26} />} titulo="Proteína extra" precio={precios.proteinaExtra}
                  activo={extras.proteina} lleno={extrasCount >= maxExtras}
                  onClick={() => extrasCount < maxExtras || extras.proteina ? setExtras((e) => ({ ...e, proteina: !e.proteina })) : null}
                />
                <ExtraCard
                  icono={<IconoQuesoWedge size={26} />} titulo="Queso extra" precio={precios.quesoExtra}
                  activo={extras.queso} lleno={extrasCount >= maxExtras}
                  onClick={() => extrasCount < maxExtras || extras.queso ? setExtras((e) => ({ ...e, queso: !e.queso })) : null}
                />
              </div>

              <h3 className="mb-2 mt-4 font-display font-extrabold">Acompañamiento extra</h3>
              <div className="flex flex-wrap gap-2">
                {linea.acompanamientos.map((a) => {
                  const activo = extras.acomp.includes(a.id);
                  const base = acamps.some((x) => x.id === a.id);
                  if (base) return null;
                  const bloqueado = !activo && extrasCount >= maxExtras;
                  return (
                    <button
                      key={a.id}
                      disabled={bloqueado}
                      onClick={() => {
                        play('pop');
                        setExtras((e) => ({
                          ...e,
                          acomp: e.acomp.includes(a.id) ? e.acomp.filter((x) => x !== a.id) : [...e.acomp, a.id],
                        }));
                      }}
                      className={`btn-tap rounded-full border-2 px-3 py-2 text-sm font-bold disabled:opacity-40 ${
                        activo ? 'border-naranja-500 bg-naranja-500/15' : 'border-tierra-700/15 dark:border-crema-200/15'
                      }`}
                    >
                      <IconoIngrediente ing={a} size={18} /> {a.nombre} <span className="opacity-60">+{fmtCLP(precios.acompanamientoExtra)}</span>
                    </button>
                  );
                })}
              </div>

              {catalogoBebidas.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-1 flex items-center gap-2 font-display font-extrabold">
                    <IconoLata size={20} color="#8b4513" />
                    Elige la bebida que quieras
                  </h3>
                  <p className="mb-2 text-xs italic opacity-70">Opcional — en lata, la que prefieras (agregada a tu pedido)</p>
                  <div className="flex flex-wrap gap-2">
                    {catalogoBebidas.filter((b) => b.disponible !== false).map((b) => {
                      const enPedido = bebidas.some((x) => x.id === b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => { play('pop'); agregarBebida(b); }}
                          className={`btn-tap flex items-center gap-1.5 rounded-full border-2 px-3 py-2 text-sm font-bold transition ${
                            enPedido
                              ? 'border-[#4a2c17] bg-[#4a2c17]/10'
                              : 'border-[#4a2c17]/20 bg-[#fffaf0]/80 hover:border-[#4a2c17]/45'
                          }`}
                        >
                          <IconoIngrediente ing={b} size={16} />
                          {b.nombre.replace(' lata', '')}
                          <span className="opacity-60">{enPedido ? '✓ en pedido' : `· ${fmtCLP(b.precio)}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {pasoActual === 'resumen' && (
            <Resumen
              nombre={nombreFinal}
              desglose={desglose}
              esDulce={esDulce}
              etiquetas={etiquetasInfo.etiquetas}
              bebidas={bebidas}
              onCarrito={alCarrito}
              onPagar={pagar}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navegación */}
      {paso < totalPasos - 1 && (
        <div className="fixed inset-x-0 bottom-12 z-40 border-t-2 border-[#4a2c17]/25 bg-[#f3e6c8]/95 p-4 backdrop-blur h-safe-b">
          <div className="mx-auto flex max-w-3xl gap-3">
            {paso > 0 && (
              <button onClick={() => setPaso((p) => p - 1)} className="vt-btn-fantasma btn-tap rounded-full px-5 py-3 font-bold">
                ←
              </button>
            )}
            <button
              onClick={() => { play('ok'); setPaso((p) => p + 1); }}
              disabled={!pasoValido()}
              className="vt-btn btn-tap flex-1 rounded-full px-5 py-3.5 text-sm disabled:opacity-40"
            >
              {pasoPenultimo ? 'Ver mi empanada' : 'Siguiente →'}
            </button>
          </div>
        </div>
      )}
      </>)}

      {ruletaAbierta && (
        <Ruleta
          dieta={dieta} bloqueos={bloqueos} aplicar={ruletaAplicar}
          onAplicar={aplicarRuleta} cerrar={() => setRuletaAbierta(false)}
        />
      )}

      <ModalPago
        abierto={modalPago}
        total={resumen.total}
        enviando={enviandoPago}
        onConfirmar={confirmarPago}
        onCancelar={() => setModalPago(false)}
      />
    </div>
  );
}

function acampsObtener(acomps, linea) {
  if (!linea) return [];
  return acomps.filter((a) => linea.acompanamientos.some((x) => x.id === a.id));
}

// Ficha vintage de ingredientes (reemplaza el círculo animado del HUD).
function FichaIngredientes({ proteina, queso, acompanamientos = [], esDulce }) {
  const items = [
    proteina && { tipo: esDulce ? 'Relleno' : 'Proteína', ing: proteina },
    queso && { tipo: 'Queso', ing: queso },
    ...acompanamientos.map((a) => ({ tipo: esDulce ? 'Extra' : 'Acomp.', ing: a })),
  ].filter(Boolean);

  return (
    <div className="vt-sello min-w-[7.5rem] rounded-2xl border border-[#4a2c17]/30 bg-[#fffaf0]/70 px-3 py-2">
      <div className="vt-separador mb-1.5 w-full" aria-hidden />
      {items.length === 0 ? (
        <p className="vt-cuerpo py-1 text-center text-[10px] italic opacity-60">Tu empanada</p>
      ) : (
        <ul className="space-y-1">
          {items.map(({ ing }, i) => (
            <li key={`${ing.id}-${i}`} className="flex items-center gap-1.5">
              <IconoIngrediente ing={ing} size={14} className="shrink-0 opacity-80" />
              <span className="vt-serif min-w-0 truncate text-[10px] font-bold leading-tight text-[#4a2c17]">
                {ing.nombre}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PasoGrid({ titulo, sub, items = [], seleccionados, onToggle, max, compact }) {
  return (
    <div>
      {titulo && <h2 className="vt-titulo text-xl">{titulo}</h2>}
      {sub && <p className="vt-cuerpo mb-3 text-sm italic opacity-70">{sub}</p>}
      <div className={`card-grid ${compact ? '' : 'mt-3'}`}>
        {items.map((ing) => {
          const idx = seleccionados.indexOf(ing.id);
          const seleccionado = idx >= 0;
          const lleno = max > 1 && !seleccionado && seleccionados.length >= max;
          return (
            <motion.button
              key={ing.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onToggle(ing)}
              disabled={lleno}
              aria-pressed={seleccionado}
              className={`btn-tap relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-colors disabled:opacity-35 ${
                seleccionado
                  ? 'border-[#4a2c17] bg-[#4a2c17]/10 shadow-[0_6px_18px_-6px_rgb(74_44_23/0.35)]'
                  : 'border-[#4a2c17]/20 bg-[#fffaf0]/80 hover:border-[#4a2c17]/45'
              }`}
            >
              {seleccionado && (
                <motion.span
                  layoutId={`check-${max}`}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#4a2c17] text-xs font-extrabold text-[#f3e6c8]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {max === 1 ? '✓' : idx + 1}
                </motion.span>
              )}
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#4a2c17]/25 bg-[#4a2c17]/8">
                <IconoIngrediente ing={ing} size={24} />
              </span>
              <span className="vt-serif text-[13px] font-bold leading-tight">{ing.nombre}</span>
              {ing.tags?.includes('vegana') && <span className="vt-cuerpo text-[10px] italic opacity-60">vegetal</span>}
              <span className="vt-cuerpo text-[11px] font-bold text-[#8b4513]">+{fmtCLP(aporteIngrediente(ing))}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ExtraCard({ icono, titulo, precio, activo, lleno, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={lleno && !activo}
      className={`btn-tap rounded-2xl border-2 p-4 text-left transition-colors disabled:opacity-40 ${
        activo ? 'border-[#4a2c17] bg-[#4a2c17]/10' : 'border-[#4a2c17]/20 bg-[#fffaf0]/80 hover:border-[#4a2c17]/45'
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#4a2c17]/25 bg-[#4a2c17]/8">{icono}</span>
      <p className="vt-serif mt-1 text-sm font-bold">{titulo}</p>
      <p className="vt-cuerpo text-xs italic opacity-70">+{fmtCLP(precio)}</p>
    </button>
  );
}

function Resumen({ nombre, desglose, esDulce, etiquetas, bebidas = [], onCarrito, onPagar }) {
  const precio = desglose.total;
  const totalBebidas = bebidas.reduce((s, b) => s + (b.precio || 0) * (b.cantidad || 1), 0);
  const totalPedido = precio + totalBebidas;

  return (
    <div>
      <h2 className="vt-titulo text-xl">¡Tu empanada está lista!</h2>
      <p className="vt-cuerpo mb-3 text-sm italic opacity-70">Revísala antes de continuar.</p>

      <div className="overflow-hidden rounded-2xl border-2 border-[#4a2c17]/30 bg-[#fffaf0]/85">
        {etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-4">
            {etiquetas.map((e) => (
              <Etiqueta key={e.id} emoji={e.emoji} color={e.color}>{e.label}</Etiqueta>
            ))}
          </div>
        )}

        <FichaEmpanada nombre={nombre} desglose={desglose} esDulce={esDulce} />
      </div>

      {/* Bebidas del pedido */}
      {bebidas.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-2xl border-2 border-[#4a2c17]/30 bg-[#fffaf0]/85">
          <p className="vt-serif border-b-2 border-[#4a2c17]/15 bg-[#4a2c17]/6 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
            Bebidas del pedido
          </p>
          <div className="space-y-1.5 px-4 py-3">
            {bebidas.map((b) => (
              <div key={b.cartId || b.id} className="flex items-baseline gap-2">
                <span className="vt-cuerpo min-w-0 flex-1 truncate text-sm">
                  {b.emoji} {b.nombre}{b.cantidad > 1 ? ` ×${b.cantidad}` : ''}
                </span>
                <span className="vt-serif shrink-0 text-sm font-bold tabular-nums">
                  {fmtCLP((b.precio || 0) * (b.cantidad || 1))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total del pedido (empanada + bebidas) */}
      {totalBebidas > 0 && (
        <div className="mt-3 flex items-baseline justify-between rounded-2xl border-2 border-[#4a2c17]/30 bg-[#fffaf0]/85 px-4 py-3">
          <span className="vt-serif text-xs font-extrabold uppercase tracking-wide">Total pedido</span>
          <span className="vt-titulo text-2xl">{fmtCLP(totalPedido)}</span>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        <button
          onClick={onPagar}
          className="vt-btn btn-tap w-full rounded-full px-6 py-4 text-base"
        >
          Pagar — {fmtCLP(totalPedido)}
        </button>
        <button
          onClick={onCarrito}
          className="vt-btn-fantasma btn-tap w-full rounded-full px-6 py-3.5 text-sm"
        >
          Agregar otra empanada
        </button>
        <p className="vt-cuerpo pt-1 text-center text-xs italic opacity-60">
          Al pagar te redirigimos al WhatsApp para enviar el comprobante
        </p>
      </div>
    </div>
  );
}
