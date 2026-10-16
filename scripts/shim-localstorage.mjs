// localStorage en memoria para que las pruebas del modo demo corran en Node.
// Debe importarse ANTES de cualquier módulo de src/ que escriba en storage.
const almacen = new Map();

globalThis.localStorage = {
  getItem(k) { return almacen.has(k) ? almacen.get(k) : null; },
  setItem(k, v) { almacen.set(String(k), String(v)); },
  removeItem(k) { almacen.delete(String(k)); },
  clear() { almacen.clear(); },
  key(i) { return [...almacen.keys()][i] ?? null; },
  get length() { return almacen.size; },
};

export function limpiarStorage() {
  almacen.clear();
}
