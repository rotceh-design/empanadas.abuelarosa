import { useEffect, useMemo, useState } from 'react';
import { observarPedidos } from '../../lib/pedidos';
import { useCatalog } from '../../contexts/CatalogContext';
import { fmtCLP } from '../../lib/formato';
import { costoPedido } from '../../lib/costos';
import { leerLog } from '../../lib/inventario';

const RANGOS = [['7', '7 días'], ['30', '30 días'], ['todo', 'Todo']];

export default function AdminMetricas() {
  const [pedidos, setPedidos] = useState([]);
  const [rango, setRango] = useState('30');
  const [log, setLog] = useState([]);
  const { porId, bebidasTodas, settings } = useCatalog();

  useEffect(() => observarPedidos(setPedidos), []);
  useEffect(() => { leerLog(100).then(setLog).catch(() => setLog([])); }, []);

  const ctx = useMemo(
    () => ({ porId, porBebida: Object.fromEntries(bebidasTodas.map((b) => [b.id, b])), settings }),
    [porId, bebidasTodas, settings],
  );

  const m = useMemo(() => {
    const corte = rango === 'todo' ? null : Date.now() - Number(rango) * 864e5;
    const enRango = (p) => {
      if (!corte) return true;
      const t = Date.parse(p.createdAt || '');
      return !Number.isNaN(t) && t >= corte;
    };
    const todos = pedidos.filter(enRango);
    const pagados = todos.filter((p) => p.status !== 'pendiente_pago');

    const totalVentas = pagados.reduce((s, p) => s + (p.totales?.total || 0), 0);
    const totalCosto = pagados.reduce((s, p) => s + costoPedido(p, ctx), 0);
    const margen = totalVentas - totalCosto;
    const empanadasVendidas = pagados.reduce((s, p) =>
      s + (p.items || []).filter((i) => i.tipo === 'empanada').reduce((x, i) => x + (i.cantidad || 1), 0), 0);

    const porDia = {};
    pagados.forEach((p) => {
      const d = (p.createdAt || '').slice(0, 10);
      if (!d) return;
      if (!porDia[d]) porDia[d] = { v: 0, c: 0 };
      porDia[d].v += p.totales?.total || 0;
      porDia[d].c += costoPedido(p, ctx);
    });

    const porComuna = {};
    const porHora = {};
    const clientes = {};
    todos.forEach((p) => {
      const comuna = p.cliente?.comuna || '—';
      porComuna[comuna] = (porComuna[comuna] || 0) + 1;
      const t = new Date(p.createdAt || '');
      if (!Number.isNaN(t.getTime())) {
        const h = `${String(t.getHours()).padStart(2, '0')}:00`;
        porHora[h] = (porHora[h] || 0) + 1;
      }
      const tel = p.cliente?.telefono?.replace(/\s/g, '');
      if (tel) {
        if (!clientes[tel]) clientes[tel] = { nombre: p.cliente?.nombre || tel, n: 0, gasto: 0 };
        clientes[tel].n += 1;
        clientes[tel].gasto += p.totales?.total || 0;
      }
    });

    const rankingIng = {};
    const combos = {};
    todos.forEach((p) => {
      (p.items || []).filter((i) => i.tipo === 'empanada').forEach((e) => {
        [e.proteinaId, e.quesoId, ...(e.acompanamientosIds || [])].forEach((id) => {
          if (id) rankingIng[id] = (rankingIng[id] || 0) + (e.cantidad || 1);
        });
        if (e.clave) {
          if (!combos[e.clave]) combos[e.clave] = { n: 0, nombre: e.nombre || e.clave };
          combos[e.clave].n += e.cantidad || 1;
        }
      });
    });

    const conteos = log.filter((l) => l.tipo === 'conteo');
    const mermaCLP = conteos.reduce((s, l) => {
      const g = typeof l.merma === 'number' && l.merma > 0 ? l.merma : 0;
      return s + (l.mermaCLP || Math.round((g * (l.costoKg || 0)) / 1000));
    }, 0);

    return {
      totalVentas, totalCosto, margen, empanadasVendidas,
      margenPct: totalVentas > 0 ? Math.round((margen / totalVentas) * 100) : 0,
      ticketPromedio: pagados.length ? Math.round(totalVentas / pagados.length) : 0,
      porDia: Object.entries(porDia).sort((a, b) => b[0].localeCompare(a[0])),
      porComuna: Object.entries(porComuna).sort((a, b) => b[1] - a[1]),
      porHora: Object.entries(porHora).sort((a, b) => b[1] - a[1]),
      clientes: Object.values(clientes).sort((a, b) => b.n - a.n).slice(0, 10),
      recurrentes: Object.values(clientes).filter((c) => c.n > 1).length,
      rankingIng: Object.entries(rankingIng).sort((a, b) => b[1] - a[1]).slice(0, 10),
      combos: Object.entries(combos).sort((a, b) => b[1].n - a[1].n).slice(0, 5),
      total: todos.length,
      mermaCLP,
    };
  }, [pedidos, rango, ctx, log]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="vt-titulo text-3xl">Métricas</h1>
          <p className="vt-cuerpo text-sm italic opacity-60">{m.total} pedidos en el período · {m.recurrentes} clientes que repiten</p>
        </div>
        <div className="flex gap-2">
          {RANGOS.map(([id, label]) => (
            <button key={id} onClick={() => setRango(id)}
              className={`btn-tap rounded-xl px-3 py-2 text-xs font-extrabold ${rango === id ? 'bg-naranja-500 text-white' : 'bg-[#8b4513]/10'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi label="Ventas" valor={fmtCLP(m.totalVentas)} emoji="💰" />
        <Kpi label="Costo ingredientes" valor={fmtCLP(m.totalCosto)} emoji="🧾" />
        <Kpi label={`Margen (${m.margenPct}%)`} valor={fmtCLP(m.margen)} emoji="📈" verde={m.margen >= 0} />
        <Kpi label="Ticket promedio" valor={fmtCLP(m.ticketPromedio)} emoji="🎟️" />
        <Kpi label="Empanadas" valor={m.empanadasVendidas} emoji="🥟" />
        <Kpi label="Merma registrada" valor={m.mermaCLP > 0 ? fmtCLP(m.mermaCLP) : '—'} emoji="🪫" rojo={m.mermaCLP > 0} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="vt-ficha rounded-3xl p-4">
          <h3 className="vt-titulo">📆 Ventas por día</h3>
          {m.porDia.length === 0 ? <p className="mt-2 text-sm opacity-60">Sin datos aún</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {m.porDia.map(([d, x]) => (
                <li key={d} className="flex justify-between gap-2">
                  <span className="font-bold">{d}</span>
                  <span>
                    {fmtCLP(x.v)}{' '}
                    <span className="text-[11px] font-bold text-verde-700">· margen {fmtCLP(x.v - x.c)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="vt-ficha rounded-3xl p-4">
          <h3 className="vt-titulo">🕐 Hora en que piden</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.porHora.length === 0 && <p className="text-sm opacity-60">Sin datos</p>}
            {m.porHora.map(([h, n]) => (
              <li key={h} className="flex justify-between"><span className="font-bold">{h}</span><span>{n} pedidos</span></li>
            ))}
          </ul>
        </div>

        <div className="vt-ficha rounded-3xl p-4">
          <h3 className="vt-titulo">📍 Comunas</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.porComuna.map(([c, n]) => (
              <li key={c} className="flex justify-between"><span className="font-bold">{c}</span><span>{n} pedidos</span></li>
            ))}
          </ul>
        </div>

        <div className="vt-ficha rounded-3xl p-4">
          <h3 className="vt-titulo">👥 Clientes que más repiten</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.clientes.length === 0 && <p className="text-sm opacity-60">Sin datos</p>}
            {m.clientes.map((c) => (
              <li key={c.nombre} className="flex justify-between gap-2">
                <span className="truncate font-bold">{c.nombre}</span>
                <span className="shrink-0">{c.n} pedidos · {fmtCLP(c.gasto)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="vt-ficha rounded-3xl p-4">
          <h3 className="vt-titulo">🥗 Ingredientes top</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.rankingIng.map(([id, n]) => (
              <li key={id} className="flex justify-between"><span className="font-bold">{porId[id]?.emoji} {porId[id]?.nombre || id}</span><span>{n}</span></li>
            ))}
          </ul>
        </div>

        <div className="vt-ficha rounded-3xl p-4">
          <h3 className="vt-titulo">🏆 Empanadas más vendidas</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.combos.map(([k, x]) => (
              <li key={k} className="flex justify-between gap-2"><span className="truncate font-bold">{x.nombre}</span><span>{x.n}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, valor, emoji, verde, rojo }) {
  return (
    <div className="vt-ficha rounded-3xl p-4">
      <p className="text-xl">{emoji}</p>
      <p className={`mt-1 vt-serif text-xl font-extrabold ${verde ? 'text-verde-700' : ''} ${rojo ? 'text-bermellon-500' : ''}`}>{valor}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-60">{label}</p>
    </div>
  );
}
