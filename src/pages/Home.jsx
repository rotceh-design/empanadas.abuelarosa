import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCatalog } from '../contexts/CatalogContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useCart } from '../contexts/CartContext';
import EmpanadaVisual from '../components/EmpanadaVisual';
import Recomendador from '../components/builder/Recomendador';
import { IconosEmpanada, IconoDulce, IconoEmpanada, IconoCandado } from '../components/Iconos';
import { SeparadorOrnamental, Floritura } from '../components/vintage/Ornamentos';
import { fmtCLP, fmtNum } from '../lib/formato';
import { combinacionesDelDia, itemCombinacionDelDia } from '../lib/daily';
import { precioEmpanada } from '../lib/precios';
import { play } from '../lib/sonidos';
import logoAbuela from '../assets/abuela-rosa.png';

export default function Home() {
  const navigate = useNavigate();
  const { lineas, lineasTodas, settings, stats, precioBase, insignias, porId } = useCatalog();
  const { perfil, desbloqueadas } = usePlayer();
  const { agregarEmpanada } = useCart();

  const total = lineas.reduce((s, l) => s + (l.total || 0), 0);

  const ranking = useMemo(() => Object.values(stats)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 3), [stats]);

  const delDia = useMemo(
    () => combinacionesDelDia({ lineas, settings, porId }),
    [lineas, settings, porId]
  );

  const pedirDelDia = (combo) => {
    if (!combo) return;
    play('ok');
    agregarEmpanada(itemCombinacionDelDia(combo, precioBase));
    navigate('/carrito');
  };

  const favoritas = perfil?.favoritas || [];

  const aplicarRecomendacion = (o) => {
    play('ok');
    const seleccion = {
      proteina: porId[o.proteinaId],
      queso: porId[o.quesoId],
      acompanamientos: (o.acompanamientosIds || []).map((id) => porId[id]).filter(Boolean),
    };
    const precioUnitario = precioEmpanada(seleccion, settings);
    const item = {
      linea: 'salada',
      nombre: o.nombre,
      proteinaId: o.proteinaId,
      quesoId: o.quesoId,
      acompanamientosIds: o.acompanamientosIds || [],
      proteina: porId[o.proteinaId]?.nombre,
      queso: porId[o.quesoId]?.nombre,
      acompanamientos: (o.acompanamientosIds || []).map((id) => porId[id]?.nombre).filter(Boolean),
      emojis: o.emojis || [porId[o.proteinaId]?.emoji, porId[o.quesoId]?.emoji, ...(o.acompanamientosIds || []).map((id) => porId[id]?.emoji)].filter(Boolean),
      colores: [porId[o.proteinaId]?.color, porId[o.quesoId]?.color],
      extras: { proteina: false, queso: false, acomp: [] },
      extrasCount: 0,
      extrasPrecio: precioUnitario - precioBase,
      etiquetas: [],
      precioUnitario,
      clave: [o.proteinaId, o.quesoId, ...(o.acompanamientosIds || [])].filter(Boolean).sort().join('+'),
    };
    agregarEmpanada(item);
    navigate('/carrito');
  };

  return (
    <div className="pb-10">
      {/* HERO */}
      <header className="relative overflow-hidden border-b-2 border-[#4a2c17]/30 bg-[#f7ecd4] px-5 pb-10 pt-8 text-center text-[#3e2213]">
        <Floritura className="absolute left-3 top-4 w-16 opacity-40" />
        <Floritura className="absolute right-3 top-4 w-16 -scale-x-100 opacity-40" />
        <div className="relative mx-auto max-w-3xl">
          <motion.img
            src={logoAbuela}
            alt="Empanadas Abuela Rosa"
            initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="mx-auto h-24 w-24 rounded-full border-2 border-[#4a2c17]/30 shadow-lift"
          />
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vt-serif text-sm font-bold uppercase tracking-[0.2em] opacity-80"
          >
            {settings?.negocio?.ubicacion}
          </motion.p>
          <h1 className="vt-titulo mt-2 text-4xl uppercase leading-none sm:text-5xl">
            Arma tu<br />empanada
          </h1>
          <SeparadorOrnamental className="mx-auto mt-3 w-56" />
          <p className="vt-cuerpo mx-auto mt-3 max-w-sm text-sm italic opacity-90">
            Tú eliges el relleno. Nosotros la freímos. Hecho al estilo de la Abuela.
          </p>

          <div className="mt-5 flex flex-col items-center">
            <span className="vt-titulo text-5xl leading-none">{fmtNum(total)}</span>
            <span className="vt-serif text-xs font-bold uppercase tracking-[0.18em] opacity-70">combinaciones posibles</span>
          </div>

          <Link
            to="/configurar"
            className="vt-btn btn-tap mt-6 inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg"
          >
            Empezar a armar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {/* Empanadas del día (3 opciones al precio del día) */}
        {delDia.length > 0 && (
          <section className="-mt-4">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <span className="vt-serif inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-[#8b4513]/40 bg-[#8b4513]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#8b4513]">
                <IconoEmpanada size={14} color="#8b4513" />
                Empanadas del día
              </span>
              <span className="vt-serif text-xs font-bold uppercase tracking-widest opacity-60">{delDia.length} opciones</span>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:grid sm:grid-cols-3">
              {delDia.map((combo, i) => (
                <motion.div
                  key={combo.clave}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="vt-sello rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="vt-serif whitespace-nowrap rounded-full border-2 border-[#8b4513]/40 bg-[#8b4513]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8b4513]">
                      Del día
                    </span>
                    <span className="vt-titulo text-sm">{fmtCLP(combo.precio)}</span>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <EmpanadaVisual proteina={porId[combo.proteinaId]} queso={porId[combo.quesoId]}
                      acompanamientos={combo.acompanamientosIds.map((id) => porId[id]).filter(Boolean)} ancho={88} modo="display" />
                  </div>
                  <p className="vt-titulo mt-2 text-center text-lg leading-tight">{combo.proteina}</p>
                  <p className="vt-cuerpo text-center text-sm italic text-[#8b4513]">{combo.queso}</p>
                  <p className="vt-cuerpo mt-1 truncate text-center text-xs opacity-60">{combo.acompanamientos.join(' · ')}</p>
                  <button
                    onClick={() => pedirDelDia(combo)}
                    className="vt-btn btn-tap mt-3 w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    Pedir por {fmtCLP(combo.precio)}
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Líneas: salada y dulce — la inactiva sale "Próximamente" y bloqueada */}
        <section className="mt-6">
          <h2 className="vt-titulo mb-2 text-xl">Nuestras líneas</h2>
          <p className="vt-cuerpo mb-2 text-sm italic opacity-60">
            Elige qué línea quieres armar. Las pausadas aparecen como “Próximamente”.
          </p>
          <div className="space-y-3">
            {lineasTodas.map((l) => (
              <LineaCard key={l.id} linea={l} settings={settings} />
            ))}
          </div>
        </section>

        {/* Ranking en vivo */}
        {ranking.length > 0 && (
          <section className="mt-6">
            <h2 className="vt-titulo text-xl">Las más pedidas</h2>
            <p className="vt-cuerpo text-sm italic opacity-60">En vivo desde la cocina</p>
            <div className="mt-3 space-y-2">
              {ranking.map((r, i) => (
                <div key={r.nombre + i} className="vt-sello flex items-center gap-3 rounded-2xl p-3">
                  <span className="vt-titulo text-2xl">#{i + 1}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#4a2c17]/20 bg-[#f7ecd4]">
                    <IconosEmpanada proteinaId={r.proteinaId} quesoId={r.quesoId}
                      acompanamientosIds={(r.acompanamientosIds || []).slice(0, 1)} porId={porId} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="vt-serif truncate text-sm font-bold">{r.nombre}</p>
                    <p className="vt-cuerpo text-xs italic opacity-60">{r.count} pedidos</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Favoritas */}
        {favoritas.length > 0 && (
          <section className="mt-6">
            <h2 className="vt-titulo text-xl">Tus favoritas</h2>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {favoritas.map((f) => (
                <Link
                  key={f.id}
                  to="/configurar"
                  className="vt-sello btn-tap flex-shrink-0 rounded-2xl p-3 text-center"
                  style={{ minWidth: 130 }}
                >
                  <p className="vt-serif truncate text-xs font-bold">{f.nombre}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recomendador IA */}
        <section className="mt-6">
          <Recomendador onElegir={aplicarRecomendacion} />
        </section>

        {/* Gamificación */}
        <section className="vt-sello mt-6 rounded-3xl p-4">
          <h2 className="vt-titulo text-lg">Tu progreso</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat valor={perfil.combinaciones.length} label="combinaciones" sufijo={`/ ${fmtNum(total || 7920)}`} />
            <Stat valor={perfil.puntos} label="puntos" />
            <Stat valor={desbloqueadas.length} label="insignias" sufijo={`/ ${insignias.length}`} />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full border border-[#4a2c17]/25 bg-[#f7ecd4]">
            <motion.div
              className="h-full bg-[#3b7a3e]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (perfil.combinaciones.length / (total || 7920)) * 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="vt-cuerpo mt-2 text-xs italic opacity-60">¡Sigue probando para desbloquear cupones!</p>
        </section>

        {/* CTA WhatsApp */}
        <section className="mt-6 text-center">
          <a
            href={`https://wa.me/${(settings?.negocio?.whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola! Quiero hacer un pedido de empanadas 🥟')}`}
            target="_blank"
            rel="noreferrer"
            className="vt-serif btn-tap inline-flex items-center gap-2 rounded-full border-2 border-[#1f7a3d] bg-[#25D366] px-6 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-puff"
          >
            Pedir por WhatsApp
          </a>
        </section>
      </div>
    </div>
  );
}

function Stat({ valor, label, sufijo }) {
  return (
    <div className="rounded-2xl border-2 border-[#4a2c17]/15 bg-[#f7ecd4]/70 p-2">
      <p className="vt-titulo text-xl">{valor}</p>
      <p className="vt-serif text-[10px] font-bold uppercase tracking-wide opacity-60">{label}</p>
      {sufijo && <p className="vt-cuerpo text-[10px] italic opacity-50">{sufijo}</p>}
    </div>
  );
}

// Tarjeta de línea (salada / dulce). Si está activa es clicable; si no,
// aparece en gris con un candado y el sello "Próximamente" (bloqueada).
function LineaCard({ linea, settings }) {
  const esDulce = linea.id === 'dulce';
  const icono = esDulce
    ? <IconoDulce size={38} color="#b8742c" />
    : <IconoEmpanada size={38} />;
  const precioMin = esDulce
    ? (settings?.lineas?.dulce?.precioMinEmpanada ?? 2790)
    : (settings?.precios?.precioMinEmpanada ?? 3490);

  if (!linea.activa) {
    return (
      <div className="vt-sello flex items-center gap-4 rounded-3xl p-4 opacity-70 grayscale">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#4a2c17]/25 bg-[#4a2c17]/8">
          <IconoCandado size={26} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="vt-serif inline-flex items-center gap-1 rounded-full border-2 border-[#8b4513]/40 bg-[#8b4513]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8b4513]">
            Próximamente
          </span>
          <span className="vt-titulo mt-1 block text-lg leading-tight">
            {esDulce ? '¡Línea dulce!' : 'Línea salada'}
          </span>
          <span className="vt-cuerpo block text-sm italic opacity-75">
            {esDulce ? 'Nutella, chocolate, manjar, piña, mango y más' : 'Carne, pollo, camarón, vegano y más'}
          </span>
        </span>
      </div>
    );
  }

  return (
    <Link
      to={esDulce ? '/configurar?linea=dulce' : '/configurar'}
      className="vt-sello btn-tap flex items-center gap-4 rounded-3xl p-4"
    >
      <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#4a2c17]/25 bg-[#4a2c17]/8">
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="vt-titulo block text-lg leading-tight">
          {esDulce ? '¡Nueva línea dulce!' : 'Línea salada'}
        </span>
        <span className="vt-cuerpo block text-sm italic opacity-75">
          {esDulce ? 'Nutella, chocolate, manjar, piña, mango y más' : 'Carne, pollo, camarón, vegano y más'} — desde {fmtCLP(precioMin)}
        </span>
      </span>
      <span className="vt-btn flex-shrink-0 rounded-xl px-3 py-2 text-xs">Probar →</span>
    </Link>
  );
}
