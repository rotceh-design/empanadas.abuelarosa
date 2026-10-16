import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useCatalog } from './CatalogContext';
import { calcularMejorOferta } from '../lib/ofertas';
import { uid } from '../lib/formato';

const CartContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem('empanadas_carrito');
    return raw ? JSON.parse(raw) : { empanadas: [], bebidas: [] };
  } catch { return { empanadas: [], bebidas: [] }; }
}

function persist(state) {
  try { localStorage.setItem('empanadas_carrito', JSON.stringify(state)); } catch { /* noop */ }
}

export function CartProvider({ children }) {
  const { ofertas, precios, precioBase } = useCatalog();
  const [state, setState] = useState(load);
  const [toast, setToast] = useState(null);

  useEffect(() => { persist(state); }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const notificar = useCallback((mensaje, emoji = '✅') => {
    setToast({ mensaje, emoji, id: uid() });
  }, []);

  const agregarEmpanada = useCallback((empanada) => {
    setState((s) => ({ ...s, empanadas: [...s.empanadas, { ...empanada, cartId: uid(), cantidad: 1 }] }));
    notificar('¡Empanada agregada al pedido!', '🥟');
  }, [notificar]);

  const agregarBebida = useCallback((bebida) => {
    setState((s) => {
      const existe = s.bebidas.find((b) => b.id === bebida.id);
      if (existe) {
        return { ...s, bebidas: s.bebidas.map((b) => (b.id === bebida.id ? { ...b, cantidad: b.cantidad + 1 } : b)) };
      }
      return { ...s, bebidas: [...s.bebidas, { ...bebida, cartId: uid(), cantidad: 1 }] };
    });
    notificar('Bebida agregada', '🥤');
  }, [notificar]);

  const actualizarEmpanada = useCallback((cartId, cambios) => {
    setState((s) => ({ ...s, empanadas: s.empanadas.map((e) => (e.cartId === cartId ? { ...e, ...cambios } : e)) }));
  }, []);

  const duplicarEmpanada = useCallback((cartId) => {
    setState((s) => {
      const original = s.empanadas.find((e) => e.cartId === cartId);
      if (!original) return s;
      return { ...s, empanadas: [...s.empanadas, { ...original, cartId: uid() }] };
    });
    notificar('Empanada duplicada', '🥟');
  }, [notificar]);

  const cambiarCantidadEmpanada = useCallback((cartId, delta) => {
    setState((s) => ({
      ...s,
      empanadas: s.empanadas
        .map((e) => (e.cartId === cartId ? { ...e, cantidad: Math.max(0, (e.cantidad || 1) + delta) } : e))
        .filter((e) => e.cantidad > 0),
    }));
  }, []);

  const cambiarCantidadBebida = useCallback((cartId, delta) => {
    setState((s) => ({
      ...s,
      bebidas: s.bebidas
        .map((b) => (b.cartId === cartId ? { ...b, cantidad: Math.max(0, (b.cantidad || 1) + delta) } : b))
        .filter((b) => b.cantidad > 0),
    }));
  }, []);

  const eliminarEmpanada = useCallback((cartId) => {
    setState((s) => ({ ...s, empanadas: s.empanadas.filter((e) => e.cartId !== cartId) }));
  }, []);

  const eliminarBebida = useCallback((cartId) => {
    setState((s) => ({ ...s, bebidas: s.bebidas.filter((b) => b.cartId !== cartId) }));
  }, []);

  const vaciar = useCallback(() => setState({ empanadas: [], bebidas: [] }), []);

  const resumen = useMemo(() => {
    const oferta = calcularMejorOferta({
      empanadas: state.empanadas,
      bebidas: state.bebidas,
      ofertas,
      precioBase,
      precioBebida: 1700,
    });
    const totalEmp = state.empanadas.reduce((s, e) => s + (e.cantidad || 1), 0);
    const totalBeb = state.bebidas.reduce((s, b) => s + (b.cantidad || 1), 0);
    return {
      ...oferta,
      totalEmpanadas: totalEmp,
      totalBebidas: totalBeb,
      vacio: totalEmp === 0 && totalBeb === 0,
    };
  }, [state, ofertas, precioBase]);

  const faltanParaDelivery = useCallback(() => {
    const desde = 2;
    const faltan = Math.max(0, desde - resumen.totalEmpanadas);
    return faltan;
  }, [resumen.totalEmpanadas]);

  const value = useMemo(() => ({
    empanadas: state.empanadas,
    bebidas: state.bebidas,
    resumen,
    precios,
    precioBase,
    agregarEmpanada, agregarBebida, actualizarEmpanada, duplicarEmpanada,
    cambiarCantidadEmpanada, cambiarCantidadBebida,
    eliminarEmpanada, eliminarBebida, vaciar,
    notificar, toast, faltanParaDelivery,
  }), [state, resumen, precios, precioBase, agregarEmpanada, agregarBebida, actualizarEmpanada,
    duplicarEmpanada, cambiarCantidadEmpanada, cambiarCantidadBebida, eliminarEmpanada,
    eliminarBebida, vaciar, notificar, toast, faltanParaDelivery]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
