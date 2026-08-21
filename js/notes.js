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

// Normaliza una medida (array de tokens sueltos o grupos) a una lista de grupos
export function normalizeMeasure(measure) {
  return measure.map(item => (item.kind === 'group' ? item : { kind: 'group', tokens: [item] }));
}

export function measureBeats(measure) {
  return normalizeMeasure(measure).reduce(
    (sum, g) => sum + g.tokens.reduce((s, t) => s + t.beats, 0),
    0
  );
}
