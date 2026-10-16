let ctx = null;

function ensure() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, duration = 0.08, type = 'sine', gain = 0.04) {
  const ac = ensure();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.stop(ac.currentTime + duration);
}

export const sonidos = {
  pop: () => { tone(660, 0.07, 'sine', 0.05); setTimeout(() => tone(880, 0.06), 55); },
  select: () => tone(523, 0.09, 'triangle', 0.05),
  ok: () => { tone(523, 0.1); setTimeout(() => tone(659, 0.1), 90); setTimeout(() => tone(784, 0.14), 180); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'triangle', 0.06), i * 90)),
  tick: () => tone(1200, 0.03, 'square', 0.02),
  alerta: () => { tone(880, 0.15, 'square', 0.06); setTimeout(() => tone(660, 0.2, 'square', 0.06), 180); },
};

export function getSonidoActivo() {
  try { return localStorage.getItem('empanadas_sonido') !== '0'; } catch { return true; }
}

export function setSonidoActivo(v) {
  try { localStorage.setItem('empanadas_sonido', v ? '1' : '0'); } catch { /* noop */ }
}

export function play(nombre) {
  if (!getSonidoActivo()) return;
  try { sonidos[nombre]?.(); } catch { /* noop */ }
}
