import { useEffect, useMemo, useState } from 'react';
import { observarPedidos } from '../../lib/pedidos';
import { useCatalog } from '../../contexts/CatalogContext';
import { fmtCLP } from '../../lib/formato';
import { costoPedido, costoPorcion, costoMasa } from '../../lib/costos';

export default function AdminProduccion() {
  const [pedidos, setPedidos] = useState([]);
  const [dia, setDia] = useState(null);
  const { porId, bebidasTodas, settings } = useCatalog();

  useEffect(() => observarPedidos(setPedidos), []);

  const fechaDe = (p) => p.entrega?.fecha || (p.createdAt || '').slice(0, 10);

  const dias = useMemo(() => {
    const set = new Set();
    pedidos.forEach((p) => { const f = fechaDe(p); if (f) set.add(f); });
    return [...set].sort().reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos]);

  useEffect(() => { if (dia === null && dias.length) setDia(dias[0]); }, [dias, dia]);

  const seleccion = useMemo(
    () => pedidos.filter((p) => (dia ? fechaDe(p) === dia : true)),
    [pedidos, dia],
  );

  const conteo = useMemo(() => {
    const res = { proteinas: {}, quesos: {}, acompanamientos: {}, bebidas: {} };
    seleccion.forEach((p) => {
      (p.items || []).forEach((it) => {
        const cant = it.cantidad || 1;
        if (it.tipo === 'bebida') {
          res.bebidas[it.nombre] = (res.bebidas[it.nombre] || 0) + cant;
          return;
        }
        if (it.proteinaId) res.proteinas[it.proteinaId] = (res.proteinas[it.proteinaId] || 0) + cant;
        if (it.quesoId) res.quesos[it.quesoId] = (res.quesos[it.quesoId] || 0) + cant;
        (it.acompanamientosIds || []).forEach((a) => {
          res.acompanamientos[a] = (res.acompanamientos[a] || 0) + cant;
        });
      });
    });
    return res;
  }, [seleccion]);

  const totalEmp = seleccion.reduce((s, p) =>
    s + (p.items || []).filter((i) => i.tipo === 'empanada').reduce((x, i) => x + (i.cantidad || 1), 0), 0);
  const totalBeb = seleccion.reduce((s, p) =>
    s + (p.items || []).filter((i) => i.tipo === 'bebida').reduce((x, i) => x + (i.cantidad || 1), 0), 0);
  const masaGramos = totalEmp * (settings?.masa?.porcionGramos || 90);
  const costoDia = seleccion.reduce((s, p) => s + costoPedido(p, { porId, porBebida: Object.fromEntries(bebidasTodas.map((b) => [b.id, b])), settings }), 0);

  const filasPlancha = (mapa, categoria) => Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => {
      const ing = porId[id];
      return {
        categoria,
        id,
        nombre: ing?.nombre || id,
        emoji: ing?.emoji || '',
        unidades: n,
        gramos: n * (ing?.porcionGramos || 0),
        costo: n * costoPorcion(ing),
      };
    });

  const filas = useMemo(() => {
    const ings = [
      ...filasPlancha(conteo.proteinas, 'proteina'),
      ...filasPlancha(conteo.quesos, 'queso'),
      ...filasPlancha(conteo.acompanamientos, 'acompanamiento'),
    ];
    const bebs = Object.entries(conteo.bebidas).sort((a, b) => b[1] - a[1]).map(([nombre, n]) => ({
      categoria: 'bebida', id: nombre, nombre, emoji: '🥤', unidades: n, gramos: 0, costo: 0,
    }));
    const masa = {
      categoria: 'masa', id: 'masa', nombre: settings?.masa?.nombre || 'Masa',
      emoji: '🫓', unidades: totalEmp, gramos: masaGramos,
      costo: totalEmp * costoMasa(settings),
    };
    return [masa, ...ings, ...bebs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conteo, totalEmp, masaGramos, settings, porId]);

  const bloque = (titulo, mapa) => {
    const entradas = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
    if (!entradas.length) return null;
    return (
      <div className="vt-ficha rounded-3xl p-4">
        <h3 className="vt-titulo">{titulo}</h3>
        <ul className="mt-2 space-y-1.5">
          {entradas.map(([id, n]) => {
            const ing = porId[id];
            const gramos = n * (ing?.porcionGramos || 0);
            return (
              <li key={id} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-bold">{ing?.emoji} {ing?.nombre || id}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] opacity-60">{fmtNum(gramos)} g · {fmtCLP(n * costoPorcion(ing))}</span>
                  <span className="rounded-full bg-naranja-500/15 px-2.5 py-0.5 font-extrabold text-naranja-600">{n}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const descargarCSV = () => {
    const encabezado = ['categoria', 'ingrediente', 'unidades', 'gramos', 'costo_clp'];
    const lineas = filas.map((f) => [f.categoria, f.nombre, f.unidades, f.gramos, f.costo]);
    const csv = '\ufeff' + [encabezado, ...lineas]
      .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produccion_${dia || 'todos'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="vt-titulo text-3xl">Producción diaria</h1>
          <p className="vt-cuerpo text-sm italic opacity-60">
            {totalEmp} empanadas{totalBeb > 0 && ` · ${totalBeb} bebidas`} · masa {fmtNum(masaGramos / 1000)} kg · costo {fmtCLP(costoDia)}
          </p>
        </div>
        <button onClick={descargarCSV} className="btn-tap rounded-xl border-2 border-[#4a2c17]/40 px-3 py-2 text-xs font-extrabold">
          ⬇ Descargar CSV
        </button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <DiaChip activo={dia === null} onClick={() => setDia(null)}>Todos</DiaChip>
        {dias.map((d) => (
          <DiaChip key={d} activo={dia === d} onClick={() => setDia(d)}>{d}</DiaChip>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {bloque('🥩 Proteínas', conteo.proteinas)}
        {bloque('🧀 Quesos', conteo.quesos)}
        <div className="sm:col-span-2">{bloque('🥗 Acompañamientos', conteo.acompanamientos)}</div>
        {bloque('🥤 Bebidas', conteo.bebidas)}
        {masaGramos > 0 && (
          <div className="vt-ficha rounded-3xl p-4">
            <h3 className="vt-titulo">🫓 Masa</h3>
            <p className="mt-2 text-sm">
              <span className="font-bold">{fmtNum(masaGramos)} g ({fmtNum(masaGramos / 1000)} kg)</span>
              <span className="text-[11px] opacity-60"> · {fmtNum(totalEmp)} porciones de {settings?.masa?.porcionGramos || 90} g · {fmtCLP(totalEmp * costoMasa(settings))}</span>
            </p>
          </div>
        )}
      </div>

      {totalEmp === 0 && (
        <p className="vt-ficha mt-6 rounded-2xl p-6 text-center opacity-60">
          No hay pedidos para {dia || 'el período seleccionado'}. ¡A producir cuando lleguen! 🧑‍🍳
        </p>
      )}
    </div>
  );
}

function DiaChip({ children, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`btn-tap flex-shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold ${activo ? 'border-[#4a2c17] bg-[#4a2c17] text-[#f3e6c8]' : 'border-[#4a2c17]/25 bg-[#8b4513]/10'}`}
    >
      {children}
    </button>
  );
}

function fmtNum(n) {
  return new Intl.NumberFormat('es-CL').format(Math.round(n * 100) / 100);
}
