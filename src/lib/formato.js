export const fmtCLP = (n) => `$${Math.round(n || 0).toLocaleString('es-CL')}`;

export const fmtNum = (n) => (n || 0).toLocaleString('es-CL');

export function normalizar(texto = '') {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

export function combinarClaves(...parts) {
  return parts.filter(Boolean).sort().join('+');
}

export function numeroPedido(secuencia) {
  return `#${String(secuencia).padStart(4, '0')}`;
}
