import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCatalog } from './CatalogContext';
import { combinarClaves, uid } from '../lib/formato';
import { calcularEtiquetas } from '../lib/etiquetas';

const PlayerContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem('empanadas_jugador');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function PlayerProvider({ children }) {
  const { insignias } = useCatalog();
  const [perfil, setPerfil] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem('empanadas_jugador', JSON.stringify(perfil));
    } catch { /* noop */ }
  }, [perfil]);

  const registrarEmpanada = (empanada) => {
    const clave = combinarClaves(empanada.proteinaId, empanada.quesoId, ...(empanada.acompanamientosIds || []));
    setPerfil((p) => {
      const base = p || nuevo();
      if (base.combinaciones.includes(clave)) return base;
      return {
        ...base,
        combinaciones: [...base.combinaciones, clave],
        proteinas: base.proteinas.includes(empanada.proteinaId) ? base.proteinas : [...base.proteinas, empanada.proteinaId],
        quesos: !empanada.quesoId || base.quesos.includes(empanada.quesoId) ? base.quesos : [...base.quesos, empanada.quesoId],
      };
    });
  };

  const registrarPedido = (pedido) => {
    setPerfil((p) => {
      const base = p || nuevo();
      const etiquetas = new Set(base.etiquetas || []);
      (pedido.etiquetas || []).forEach((e) => etiquetas.add(e));
      return {
        ...base,
        pedidos: base.pedidos + 1,
        puntos: base.puntos + 50,
        etiquetas: [...etiquetas],
      };
    });
  };

  const guardarFavorita = (empanada) => {
    setPerfil((p) => {
      const base = p || nuevo();
      const clave = combinarClaves(empanada.proteinaId, empanada.quesoId, ...(empanada.acompanamientosIds || []));
      if (base.favoritas.some((f) => f.clave === clave)) return base;
      return { ...base, favoritas: [...base.favoritas, { ...empanada, clave, id: uid() }] };
    });
  };

  const eliminarFavorita = (clave) => {
    setPerfil((p) => (p ? { ...p, favoritas: p.favoritas.filter((f) => f.clave !== clave) } : p));
  };

  const desbloqueadas = useMemo(() => {
    if (!perfil) return [];
    return insignias.filter((i) => evaluar(i.condicion, perfil));
  }, [perfil, insignias]);

  const value = useMemo(() => ({
    perfil: perfil || nuevo(),
    registrarEmpanada, registrarPedido, guardarFavorita, eliminarFavorita,
    desbloqueadas,
    totalProteinas: perfil?.proteinas?.length || 0,
  }), [perfil, desbloqueadas]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

function nuevo() {
  return {
    combinaciones: [], proteinas: [], quesos: [], etiquetas: [],
    favoritas: [], pedidos: 0, puntos: 0,
  };
}

function evaluar(condicion, perfil) {
  if (!condicion) return false;
  switch (condicion.tipo) {
    case 'proteinasDistintas': return (perfil.proteinas?.length || 0) >= condicion.valor;
    case 'quesosDistintos': return (perfil.quesos?.length || 0) >= condicion.valor;
    case 'veggieCount': return (perfil.etiquetas || []).filter((e) => e === 'vegana' || e === 'vegetariana').length >= condicion.valor;
    case 'marCount': return (perfil.etiquetas || []).filter((e) => e === 'marisco' || e === 'pescado').length >= condicion.valor;
    case 'pedidos': return (perfil.pedidos || 0) >= condicion.valor;
    default: return false;
  }
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer debe usarse dentro de PlayerProvider');
  return ctx;
}

export function etiquetasDeEmpanada(empanada) {
  return calcularEtiquetas(empanada).etiquetas.map((e) => e.id);
}
