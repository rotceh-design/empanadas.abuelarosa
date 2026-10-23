import { useEffect, useState } from 'react';
import { guardarSettingsPatch } from '../../lib/inventario';
import { useCatalog } from '../../contexts/CatalogContext';
import { combinacionDelDia } from '../../lib/daily';
import {
  IconoTienda, IconoLineas, IconoMoneda, IconoCamion, IconoCalendario,
  IconoEstrella, IconoIA, IconoGuardar, IconoPin, IconoCandado,
} from '../../components/IconosAdmin';

export default function AdminConfig() {
  const { settings, lineas, porId } = useCatalog();
  const [form, setForm] = useState(settings);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');

  // Si settings carga después de montar (Supabase/realtime) y el usuario
  // no ha tocado nada, sincronizamos el form para no arrastrar la semilla.
  useEffect(() => {
    if (!dirty) setForm(settings);
  }, [settings, dirty]);

  const set = (ruta, valor) => {
    setDirty(true);
    setForm((f) => {
      const copia = JSON.parse(JSON.stringify(f));
      const partes = ruta.split('.');
      let o = copia;
      partes.slice(0, -1).forEach((p) => { o = o[p]; });
      o[partes[partes.length - 1]] = valor;
      return copia;
    });
  };

  const guardar = async () => {
    setMsg('Guardando…');
    try {
      await guardarSettingsPatch(form);
      setMsg('✓ Configuración guardada');
    } catch (e) {
      console.error('No se pudo guardar la configuración:', e);
      setMsg('No se pudo guardar. Revisa la conexión e inténtalo de nuevo.');
    }
  };

  return (
    <div>
      <h1 className="vt-titulo text-3xl">Configuración</h1>
      <p className="vt-cuerpo text-sm italic opacity-60">Todo lo que ves aquí se guarda en Supabase y se aplica al instante</p>
      {msg && <p className="mt-2 rounded-xl bg-verde-400/15 px-3 py-2 text-sm font-bold text-verde-600">{msg}</p>}

      <div className="mt-4 space-y-4">
        <Seccion titulo="Negocio" icono={IconoTienda}>
          <Input label="Nombre" value={form.negocio?.nombre} onChange={(v) => set('negocio.nombre', v)} />
          <Input label="Ubicación" value={form.negocio?.ubicacion} onChange={(v) => set('negocio.ubicacion', v)} />
          <Input label="WhatsApp" value={form.negocio?.whatsapp} onChange={(v) => set('negocio.whatsapp', v)} />
          <Input label="Instagram" value={form.negocio?.instagram} onChange={(v) => set('negocio.instagram', v)} />
        </Seccion>

        <Seccion titulo="Líneas activas" icono={IconoLineas}>
          <Toggle label="Línea Salada" value={form.lineas?.salada?.activa} onChange={(v) => set('lineas.salada.activa', v)} />
          <Toggle label="Línea Dulce" value={form.lineas?.dulce?.activa} onChange={(v) => set('lineas.dulce.activa', v)} />
          {form.lineas?.dulce?.activa && (
            <>
              <Input label="Acompañamientos en dulce (máx. 1 a 4)" type="number" value={form.lineas?.dulce?.cantidadAcompanamientos}
                onChange={(v) => set('lineas.dulce.cantidadAcompanamientos', Number(v))} />
              <p className="text-xs font-extrabold uppercase tracking-wide opacity-60">Rango de precio dulce</p>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Dulce mín." type="number" value={form.lineas?.dulce?.precioMinEmpanada ?? 2790}
                  onChange={(v) => set('lineas.dulce.precioMinEmpanada', Number(v))} />
                <Input label="Dulce máx." type="number" value={form.lineas?.dulce?.precioMaxEmpanada ?? 3390}
                  onChange={(v) => set('lineas.dulce.precioMaxEmpanada', Number(v))} />
              </div>
            </>
          )}
        </Seccion>

        <Seccion titulo="Precios" icono={IconoMoneda}>
          <p className="text-xs opacity-60">Cada ingrediente aporta su valor; el precio de la empanada queda dentro del rango mínimo–máximo.</p>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Empanada mín." type="number" value={form.precios?.precioMinEmpanada} onChange={(v) => set('precios.precioMinEmpanada', Number(v))} />
            <Input label="Empanada máx." type="number" value={form.precios?.precioMaxEmpanada} onChange={(v) => set('precios.precioMaxEmpanada', Number(v))} />
          </div>
          <Input label="Empanada base (referencia ofertas)" type="number" value={form.precios?.empanadaBase} onChange={(v) => set('precios.empanadaBase', Number(v))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Proteína extra" type="number" value={form.precios?.proteinaExtra} onChange={(v) => set('precios.proteinaExtra', Number(v))} />
            <Input label="Queso extra" type="number" value={form.precios?.quesoExtra} onChange={(v) => set('precios.quesoExtra', Number(v))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Acompañamiento extra" type="number" value={form.precios?.acompanamientoExtra} onChange={(v) => set('precios.acompanamientoExtra', Number(v))} />
            <Input label="Máx. extras" type="number" value={form.precios?.maxExtrasPorEmpanada} onChange={(v) => set('precios.maxExtrasPorEmpanada', Number(v))} />
          </div>
        </Seccion>

        <Seccion titulo="Delivery" icono={IconoCamion}>
          <Input label="Gratis desde (empanadas)" type="number" value={form.delivery?.gratisDesdeEmpanadas} onChange={(v) => set('delivery.gratisDesdeEmpanadas', Number(v))} />
          <Input label="Costo delivery" type="number" value={form.delivery?.costo} onChange={(v) => set('delivery.costo', Number(v))} />
          <Input label="Comunas gratis (separadas por coma)" value={(form.delivery?.comunasGratis || []).join(', ')}
            onChange={(v) => set('delivery.comunasGratis', v.split(',').map((s) => s.trim()).filter(Boolean))} />
        </Seccion>

        <Seccion titulo="Producción" icono={IconoCalendario}>
          <Input label="Días habilitados (coma)" value={(form.produccion?.diasHabilitados || []).join(', ')}
            onChange={(v) => set('produccion.diasHabilitados', v.split(',').map((s) => s.trim()).filter(Boolean))} />
          <Input label="Horas (coma)" value={(form.produccion?.horas || []).join(', ')}
            onChange={(v) => set('produccion.horas', v.split(',').map((s) => s.trim()).filter(Boolean))} />
        </Seccion>

        <Seccion titulo="Gamificación" icono={IconoEstrella}>
          <Toggle label="Activa" value={form.gamificacion?.activa} onChange={(v) => set('gamificacion.activa', v)} />
          <Input label="Puntos por pedido" type="number" value={form.gamificacion?.puntosPorPedido} onChange={(v) => set('gamificacion.puntosPorPedido', Number(v))} />
          <Input label="Código cupón" value={form.gamificacion?.cuponCodigo} onChange={(v) => set('gamificacion.cuponCodigo', v)} />
          <Input label="Descuento cupón (%)" type="number" value={form.gamificacion?.cuponDescuento} onChange={(v) => set('gamificacion.cuponDescuento', Number(v))} />
        </Seccion>

        <Seccion titulo="Empanadas del día" icono={IconoEstrella}>
          <p className="text-xs opacity-60">3 empanadas al día (terrestre, del mar y vegana) a precio especial. Cambian solas cada día a las 00:00 (mismas para todos).</p>
          <Toggle label="Activas en el banner" value={form.combinacionDia?.activo !== false} onChange={(v) => set('combinacionDia.activo', v)} />
          <Input label="Precio del día (c/u)" type="number" value={form.combinacionDia?.precio ?? 2990}
            onChange={(v) => set('combinacionDia.precio', Number(v))} />
          {form.combinacionDia?.forzada ? (
            <div className="rounded-2xl bg-verde-400/12 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-extrabold text-verde-600">
                <IconoCandado size={15} /> Primera combinación fijada
              </p>
              <p className="mt-1 opacity-70">Se muestra a todos los clientes hasta que la quites; las otras 2 siguen cambiando solas.</p>
              <button onClick={() => set('combinacionDia.forzada', null)}
                className="btn-tap mt-2 rounded-xl bg-bermellon-500/15 px-3 py-1.5 text-xs font-extrabold text-bermellon-500">
                Quitar fijado
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const cfg = combinacionDelDia({ lineas, settings: { ...form, combinacionDia: { ...form.combinacionDia, forzada: null } }, porId });
                if (!cfg) { setMsg('No se pudo generar la combinación.'); return; }
                set('combinacionDia.forzada', {
                  proteinaId: cfg.proteinaId, quesoId: cfg.quesoId, acompanamientosIds: cfg.acompanamientosIds,
                });
                setMsg(`✓ Fijada: ${cfg.proteina} + ${cfg.queso}`);
              }}
              className="btn-tap vt-btn-fantasma flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs">
              <IconoPin size={14} /> Fijar la primera de hoy
            </button>
          )}
        </Seccion>

        <Seccion titulo="IA y pagos" icono={IconoIA}>
          <Toggle label="Recomendación IA" value={form.ia?.activa} onChange={(v) => set('ia.activa', v)} />
          <Toggle label="Pago online (próximamente)" value={form.pago?.onlineActivo} onChange={(v) => set('pago.onlineActivo', v)} />
          <Input label="Mensaje de pago" value={form.pago?.mensaje} onChange={(v) => set('pago.mensaje', v)} />
        </Seccion>

        <button onClick={guardar} className="btn-tap flex w-full items-center justify-center gap-2 rounded-2xl bg-naranja-500 py-4 font-extrabold text-white shadow-puff">
          <IconoGuardar size={17} /> Guardar configuración
        </button>
      </div>
    </div>
  );
}

function Seccion({ titulo, icono: Icono, children }) {
  return (
    <div className="vt-ficha rounded-3xl p-4">
      <h3 className="vt-titulo mb-3 flex items-center gap-2">
        {Icono && <Icono size={17} className="opacity-70" />}
        {titulo}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide opacity-60">{label}</label>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="vt-input w-full px-3 py-2.5" />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className="vt-ficha-suave flex w-full items-center justify-between rounded-2xl px-3 py-2.5">
      <span className="text-sm font-extrabold">{label}</span>
      <span className={`h-6 w-11 rounded-full transition ${value ? 'bg-verde-500' : 'bg-tierra-700/30'}`}>
        <span className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition ${value ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}
