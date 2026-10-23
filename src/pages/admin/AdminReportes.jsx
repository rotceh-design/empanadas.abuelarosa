import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCatalog } from '../../contexts/CatalogContext';
import { cargarPedidosRango } from '../../lib/pedidos';
import {
  construirReporte, periodoRango, periodoAnterior, periodosDisponibles,
} from '../../lib/reportes';
import { fmtCLP } from '../../lib/formato';
import { IconoReporte, IconoMoneda, IconoEmpanadaLinea, IconoCliente } from '../../components/IconosAdmin';

const fmtNum = (n) => (n ?? 0).toLocaleString('es-CL');

export default function AdminReportes() {
  const { porId, bebidasTodas, settings } = useCatalog();
  const [tipo, setTipo] = useState('mes');
  const [valorMes, setValorMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [valorAnio, setValorAnio] = useState(() => String(new Date().getFullYear()));
  const [cargando, setCargando] = useState(false);
  const [generando, setGenerando] = useState(null);
  const [error, setError] = useState('');
  const [reporte, setReporte] = useState(null);

  const opciones = useMemo(() => periodosDisponibles(tipo), [tipo]);
  const periodo = useMemo(
    () => periodoRango(tipo, tipo === 'mes' ? valorMes : valorAnio),
    [tipo, valorMes, valorAnio],
  );

  const generar = async () => {
    setCargando(true);
    setError('');
    try {
      const pedidos = await cargarPedidosRango(periodo.desde, periodo.hasta);
      const ctx = { porId, bebidas: bebidasTodas, settings };
      setReporte(construirReporte(pedidos, ctx, periodo));
    } catch (e) {
      setError(`No se pudo generar el reporte: ${e.message}`);
      setReporte(null);
    } finally {
      setCargando(false);
    }
  };

  const descargar = async (tipoArchivo) => {
    if (!reporte || generando) return;
    setGenerando(tipoArchivo);
    setError('');
    try {
      const periodoAnt = periodoAnterior(reporte.periodo);
      const pedidosAnt = await cargarPedidosRango(periodoAnt.desde, periodoAnt.hasta);
      const completo = {
        ...reporte,
        anterior: construirReporte(pedidosAnt, { porId, bebidas: bebidasTodas, settings }, periodoAnt),
      };
      if (tipoArchivo === 'excel') {
        const { generarExcelReporte, nombreArchivoReporte, descargarBlob } = await import('../../lib/excelReporte');
        const blob = await generarExcelReporte(completo);
        descargarBlob(blob, nombreArchivoReporte(reporte.periodo, 'xlsx'));
      } else {
        const { generarInformeWord } = await import('../../lib/informeWord');
        const { descargarBlob, nombreArchivoReporte } = await import('../../lib/excelReporte');
        const blob = await generarInformeWord(completo);
        descargarBlob(blob, nombreArchivoReporte(reporte.periodo, 'docx'));
      }
    } catch (e) {
      console.error(e);
      setError(`No se pudo crear el archivo: ${e.message}`);
    } finally {
      setGenerando(null);
    }
  };

  const k = reporte?.kpis;

  return (
    <div>
      <h1 className="vt-titulo text-3xl">Reportes</h1>
      <p className="vt-cuerpo text-sm italic opacity-60">
        Excel con todos los datos + informe ejecutivo Word con conclusiones y recomendaciones.
      </p>

      {/* Selector de período */}
      <div className="vt-ficha mt-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="vt-serif mb-1 text-[11px] font-bold uppercase tracking-widest opacity-70">Tipo</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setTipo('mes'); setReporte(null); }}
                className={`btn-tap vt-serif rounded-xl border-2 px-4 py-2 text-xs font-bold uppercase ${
                  tipo === 'mes' ? 'border-[#4a2c17] bg-[#4a2c17] text-[#f3e6c8]' : 'border-[#4a2c17]/25 hover:bg-[#8b4513]/10'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => { setTipo('anio'); setReporte(null); }}
                className={`btn-tap vt-serif rounded-xl border-2 px-4 py-2 text-xs font-bold uppercase ${
                  tipo === 'anio' ? 'border-[#4a2c17] bg-[#4a2c17] text-[#f3e6c8]' : 'border-[#4a2c17]/25 hover:bg-[#8b4513]/10'
                }`}
              >
                Anual
              </button>
            </div>
          </div>
          <div className="min-w-[12rem]">
            <p className="vt-serif mb-1 text-[11px] font-bold uppercase tracking-widest opacity-70">Período</p>
            <select
              value={tipo === 'mes' ? valorMes : valorAnio}
              onChange={(e) => {
                if (tipo === 'mes') setValorMes(e.target.value);
                else setValorAnio(e.target.value);
                setReporte(null);
              }}
              className="vt-input w-full rounded-xl px-3 py-2 text-sm"
            >
              {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
          </div>
          <button
            onClick={generar}
            disabled={cargando}
            className="vt-btn btn-tap rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {cargando ? 'Cargando pedidos…' : 'Generar reporte'}
          </button>
        </div>
        {error && (
          <p className="vt-cuerpo mt-3 rounded-xl bg-bermellon-500/10 px-3 py-2 text-sm font-bold text-bermellon-500">{error}</p>
        )}
      </div>

      {/* Preview + descargas */}
      {reporte && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
          <div className="vt-ficha rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="vt-serif text-[11px] font-bold uppercase tracking-widest opacity-70">Reporte listo</p>
                <p className="vt-titulo text-xl">{reporte.periodo.etiqueta}</p>
                <p className="vt-cuerpo text-xs italic opacity-60">{fmtNum(reporte.kpis.pedidos)} pedidos analizados</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => descargar('excel')}
                  disabled={generando}
                  className="vt-btn btn-tap rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {generando === 'excel' ? 'Creando…' : 'Descargar Excel'}
                </button>
                <button
                  onClick={() => descargar('word')}
                  disabled={generando}
                  className="vt-btn-fantasma btn-tap rounded-xl border-2 border-[#4a2c17]/40 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {generando === 'word' ? 'Creando…' : 'Descargar informe Word'}
                </button>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi icono={IconoMoneda} etiqueta="Ventas" valor={fmtCLP(k.ventas)} />
            <Kpi icono={IconoEmpanadaLinea} etiqueta="Empanadas" valor={fmtNum(k.empanadasVendidas)} />
            <Kpi icono={IconoMoneda} etiqueta="Margen" valor={fmtCLP(k.margen)} extra={`${k.margenPct}%`} />
            <Kpi icono={IconoCliente} etiqueta="Clientes" valor={fmtNum(k.clientesUnicos)} />
          </div>

          {/* Top productos y clientes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="vt-ficha rounded-2xl p-4">
              <p className="vt-serif text-[11px] font-bold uppercase tracking-widest opacity-70">Top productos</p>
              {reporte.topProductos.length === 0 && <p className="vt-cuerpo mt-2 text-sm italic opacity-60">Sin ventas en el período.</p>}
              <ul className="mt-2 space-y-1.5">
                {reporte.topProductos.slice(0, 5).map((p) => (
                  <li key={p.clave} className="vt-cuerpo flex justify-between text-sm">
                    <span className="truncate pr-2">{p.nombre}</span>
                    <span className="shrink-0 font-bold">{fmtNum(p.empanadas)}u</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="vt-ficha rounded-2xl p-4">
              <p className="vt-serif text-[11px] font-bold uppercase tracking-widest opacity-70">Top clientes</p>
              {reporte.topClientes.length === 0 && <p className="vt-cuerpo mt-2 text-sm italic opacity-60">Sin clientes en el período.</p>}
              <ul className="mt-2 space-y-1.5">
                {reporte.topClientes.slice(0, 5).map((c) => (
                  <li key={c.telefono || c.nombre} className="vt-cuerpo flex justify-between text-sm">
                    <span className="truncate pr-2">{c.nombre}</span>
                    <span className="shrink-0 font-bold">{fmtCLP(c.gastado)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Insights */}
          <div className="vt-ficha rounded-2xl p-4">
            <p className="vt-serif text-[11px] font-bold uppercase tracking-widest opacity-70">Conclusiones automáticas</p>
            <ul className="mt-2 space-y-2">
              {reporte.insights.map((ins, i) => (
                <li key={i} className="vt-cuerpo rounded-xl border border-[#4a2c17]/15 bg-[#fffaf0]/60 p-3 text-sm">
                  <span className="vt-serif block font-bold" style={{
                    color: ins.nivel === 'alerta' ? '#B5402F' : ins.nivel === 'ok' ? '#3B7A3E' : '#4a2c17',
                  }}>
                    {ins.titulo}
                  </span>
                  <span className="opacity-75">{ins.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {!reporte && !cargando && (
        <div className="vt-ficha mt-5 rounded-2xl p-8 text-center">
          <IconoReporte size={40} className="mx-auto opacity-50" />
          <p className="vt-cuerpo mt-2 text-sm italic opacity-60">
            Elige un período y pulsa «Generar reporte» para ver el análisis y descargar los archivos.
          </p>
        </div>
      )}
    </div>
  );
}

function Kpi({ icono: Icono, etiqueta, valor, extra }) {
  return (
    <div className="vt-ficha rounded-2xl p-3">
      <span className="flex items-center gap-1.5">
        <Icono size={14} className="opacity-60" />
        <span className="vt-serif text-[10px] font-bold uppercase tracking-widest opacity-60">{etiqueta}</span>
      </span>
      <p className="vt-titulo mt-1 text-lg">{valor}</p>
      {extra && <p className="vt-cuerpo text-xs font-bold text-verde-600">{extra}</p>}
    </div>
  );
}
