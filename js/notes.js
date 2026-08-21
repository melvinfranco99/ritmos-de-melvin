// Modelo de figuras ritmicas. Todas las duraciones estan en "negras" (1 negra = 1 beat).
// base: 4 redonda, 2 blanca, 1 negra, 0.5 corchea, 0.25 semicorchea, 0.125 fusa

function makeToken(kind, base, dotted, label) {
  return {
    kind,               // 'note' | 'rest'
    base,                // valor base sin puntillo
    dotted: !!dotted,
    beats: base * (dotted ? 1.5 : 1),
    label
  };
}

export const NOTE = {
  redonda: () => makeToken('note', 4, false, 'redonda'),
  blanca: (d = false) => makeToken('note', 2, d, d ? 'blanca con puntillo' : 'blanca'),
  negra: (d = false) => makeToken('note', 1, d, d ? 'negra con puntillo' : 'negra'),
  corchea: (d = false) => makeToken('note', 0.5, d, d ? 'corchea con puntillo' : 'corchea'),
  semicorchea: (d = false) => makeToken('note', 0.25, d, d ? 'semicorchea con puntillo' : 'semicorchea'),
  fusa: (d = false) => makeToken('note', 0.125, d, d ? 'fusa con puntillo' : 'fusa')
};

export const REST = {
  redonda: () => makeToken('rest', 4, false, 'silencio de redonda'),
  blanca: (d = false) => makeToken('rest', 2, d, 'silencio de blanca'),
  negra: (d = false) => makeToken('rest', 1, d, 'silencio de negra'),
  corchea: (d = false) => makeToken('rest', 0.5, d, 'silencio de corchea'),
  semicorchea: (d = false) => makeToken('rest', 0.25, d, 'silencio de semicorchea'),
  fusa: (d = false) => makeToken('rest', 0.125, d, 'silencio de fusa')
};

// Atajos cortos para autoria de niveles
export const W = NOTE.redonda;
export const H = NOTE.blanca;
export const Q = NOTE.negra;
export const E = NOTE.corchea;
export const S = NOTE.semicorchea;
export const F = NOTE.fusa;

export const rW = REST.redonda;
export const rH = REST.blanca;
export const rQ = REST.negra;
export const rE = REST.corchea;
export const rS = REST.semicorchea;
export const rF = REST.fusa;

// Agrupa tokens que deben unirse con barra si su duracion lo permite (corchea o menor)
export function beam(...tokens) {
  return { kind: 'group', tokens };
}

// Tresillos: 3 figuras en el tiempo de 2, p.ej. 3 negras en el tiempo de 2 negras.
const TRIPLET_NAME = { 2: 'blanca', 1: 'negra', 0.5: 'corchea', 0.25: 'semicorchea' };

function tripletToken(kind, base) {
  const name = TRIPLET_NAME[base];
  return {
    kind,
    base,
    dotted: false,
    beats: (base * 2) / 3,
    label: kind === 'rest' ? `silencio de ${name} (tresillo)` : `${name} (tresillo)`
  };
}

function tripletGroup(base, pattern = ['note', 'note', 'note']) {
  return { kind: 'group', tokens: pattern.map(k => tripletToken(k, base)), tuplet: 3 };
}

export const TRIPLET = {
  blanca: (pattern) => tripletGroup(2, pattern),
  negra: (pattern) => tripletGroup(1, pattern),
  corchea: (pattern) => tripletGroup(0.5, pattern),
  semicorchea: (pattern) => tripletGroup(0.25, pattern)
};

// Atajos: tresillo de blanca / negra / corchea / semicorchea
export const trH = TRIPLET.blanca;
export const trQ = TRIPLET.negra;
export const trE = TRIPLET.corchea;
export const trS = TRIPLET.semicorchea;

// Normaliza una medida (array de tokens sueltos o grupos) a una lista de grupos
export function normalizeMeasure(content) {
  return content.map(item => (item.kind === 'group' ? item : { kind: 'group', tokens: [item] }));
}

export function contentBeats(content) {
  return normalizeMeasure(content).reduce(
    (sum, g) => sum + g.tokens.reduce((s, t) => s + t.beats, 0),
    0
  );
}

// Una medida puede ser un array "plano" de contenido (se asume compas de 4/4)
// o un objeto { sig: [numerador, denominador], content: [...] } para otros compases.
export function measureOf(measure) {
  return Array.isArray(measure) ? { sig: [4, 4], content: measure } : measure;
}

export function measureBeats(measure) {
  return contentBeats(measureOf(measure).content);
}

// Duracion total de un compas (en negras) segun su indicador de compas
export function sigBeats([num, den]) {
  return num * (4 / den);
}

// Pulsos (en negras, relativos al inicio del compas) donde debe sonar el metronomo.
// Para compases de denominador 8 se agrupan las corcheas en celdas de 3 y 2
// siguiendo la convencion habitual (6/8 = 3+3, 5/8 = 3+2, 7/8 = 3+2+2).
export const EIGHT_GROUPING = { 5: [3, 2], 6: [3, 3], 7: [3, 2, 2], 8: [3, 3, 2], 9: [3, 3, 3] };

export function pulsesForSig([num, den]) {
  if (den === 4) return Array.from({ length: num }, (_, i) => i);
  if (den === 8) {
    const groups = EIGHT_GROUPING[num] || Array(Math.round(num / 2)).fill(2);
    const pulses = [];
    let acc = 0;
    groups.forEach(g => { pulses.push(acc); acc += g * 0.5; });
    return pulses;
  }
  const beats = sigBeats([num, den]);
  return Array.from({ length: Math.round(beats) }, (_, i) => i);
}
