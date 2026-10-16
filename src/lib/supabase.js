import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// VITE_SUPABASE_OFF=1 fuerza el modo local/demo aunque existan las claves.
// Lo usan los tests para verificar el fallback sin tocar la base real.
const apagado = import.meta.env.VITE_SUPABASE_OFF === '1';

export const isSupabaseConfigured = !apagado && Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;

let canalSeq = 0;

// Lee una tabla completa (opcionalmente una sola fila) y se suscribe a sus
// cambios en vivo. Devuelve una función para cancelar. Si algo falla en la
// lectura inicial, llama onErr y no hace nada más.
export function suscribirTabla({
  tabla,
  ordenarPor = null,
  mapa = (row) => row,
  onChange,
  onErr = () => {},
  unaFila = false,
  idFila = 'main',
}) {
  if (!supabase) return () => {};

  let cancelado = false;

  const cargar = async () => {
    try {
      let q = supabase.from(tabla).select('*');
      if (unaFila) q = q.eq('id', idFila).maybeSingle();
      else if (ordenarPor) q = q.order(ordenarPor, { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      if (cancelado) return;
      if (unaFila) onChange(data ? mapa(data) : null);
      else onChange((data || []).map(mapa));
    } catch (e) {
      if (!cancelado) onErr(e);
    }
  };

  cargar();

  const nombre = `tbl-${tabla}-${canalSeq++}`;
  const canal = supabase
    .channel(nombre)
    .on('postgres_changes', { event: '*', schema: 'public', table: tabla }, () => cargar())
    .subscribe();

  return () => { cancelado = true; supabase.removeChannel(canal); };
}

// ---------- Mapeo fila Supabase (snake_case) → objeto de la app (camelCase) ----------

export function mapIngredient(row) {
  if (!row) return row;
  return {
    ...row,
    porcionGramos: row.porcion_gramos,
    costoKg: row.costo_kg,
    stockGramos: row.stock_gramos,
    porcion_gramos: undefined,
    costo_kg: undefined,
    stock_gramos: undefined,
  };
}

export function mapDrink(row) {
  if (!row) return row;
  return {
    ...row,
    stockUnidades: row.stock_unidades,
    stock_unidades: undefined,
  };
}

export function mapOffer(row) {
  return row;
}

export function mapRule(row) {
  if (!row) return row;
  return {
    ...row,
    baseTipo: row.base_tipo,
    baseId: row.base_id,
    base_tipo: undefined,
    base_id: undefined,
  };
}

export function mapBadge(row) {
  return row;
}

export function mapStats(row) {
  if (!row) return row;
  return {
    ...row,
    proteinaId: row.proteina_id,
    quesoId: row.queso_id,
    acompanamientosIds: row.acompanamientos_ids,
    proteina_id: undefined,
    queso_id: undefined,
    acompanamientos_ids: undefined,
  };
}

export function mapOrder(row) {
  if (!row) return row;
  return {
    ...row,
    stockDescontado: row.stock_descontado,
    createdAt: row.created_at,
    actualizadoEn: row.updated_at,
    stock_descontado: undefined,
    created_at: undefined,
    updated_at: undefined,
  };
}

export function mapCustomer(row) {
  if (!row) return row;
  return {
    ...row,
    ultimaCombinacion: row.ultima_combinacion,
    ultimaFecha: row.ultima_fecha,
    ultima_combinacion: undefined,
    ultima_fecha: undefined,
  };
}

// settings: el frontend espera el objeto plano; Supabase lo guarda en data (jsonb)
export function mapSettings(row) {
  if (!row) return row;
  return row.data ?? {};
}
