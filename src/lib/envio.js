// Datos de envío del cliente — se guardan una vez y se reutilizan en todos los pedidos
const CLAVE = 'empanadas_envio';

export function getEnvio() {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function guardarEnvio(datos) {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* noop */ }
  return datos;
}

export function limpiarEnvio() {
  try { localStorage.removeItem(CLAVE); } catch { /* noop */ }
}
