// Generador determinista de ejercicios. Con la misma seed siempre produce el
// mismo resultado, para que la web sea estable entre visitas y se pueda
// validar (los compases siempre cuadran con su indicador de compas).
import { W, H, Q, E, S, F, rQ, rE, beam, trH, trQ, trE, trS, EIGHT_GROUPING } from './notes.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rng, values, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < values.length; i++) {
    r -= weights[i];
    if (r <= 0) return values[i];
  }
  return values[values.length - 1];
}

function cell(factory, tags = []) {
  return { factory, tags };
}

// Filtra un catalogo de celdas dejando solo las que el nivel tiene desbloqueadas
function unlock(pool, allowed) {
  return pool.filter(e => e.tags.every(t => allowed.has(t)));
}

function pickCell(rng, pool, boosts) {
  if (pool.length === 0) throw new Error('generateExercises: no hay celdas desbloqueadas para este hueco (revisa allowedTags)');
  const weights = pool.map(e => e.tags.reduce((w, t) => w * (boosts[t] || 1), 1));
  const entry = pickWeighted(rng, pool, weights);
  return entry.factory();
}

// --- Celdas de 1 tiempo (grid de negra) ---
const CELLS_1 = [
  cell(() => [Q()]),
  cell(() => [rQ()]),
  cell(() => [beam(E(), E())], ['eighth']),
  // ojo: se evita a proposito la celda [corchea, silencio de corchea]: en una
  // caja sin resonancia suena identico a una negra suelta y confunde al leer.
  cell(() => [beam(rE(), E())], ['eighth']),
  cell(() => [beam(S(), S(), S(), S())], ['sixteenth']),
  cell(() => [beam(E(), S(), S())], ['mixedEighthSixteenth']),
  cell(() => [beam(S(), S(), E())], ['mixedEighthSixteenth']),
  cell(() => [beam(E(true), S())], ['dottedEighth']),
  cell(() => [beam(S(), E(true))], ['dottedEighth']),
  cell(() => [beam(F(), F(), F(), F(), F(), F(), F(), F())], ['fusa']),
  cell(() => [trE()], ['tripletQE']),
  cell(() => [trE(['note', 'note', 'rest'])], ['tripletQE']),
  cell(() => [trE(['note', 'rest', 'note'])], ['tripletQE']),
  cell(() => [trS(), trS()], ['tripletS']),
  cell(() => [trS(), E()], ['tripletS']),
  cell(() => [E(), trS()], ['tripletS'])
];

// --- Celdas de 1.5 tiempos: el "tiempo" natural de los compases compuestos ---
const CELLS_1_5 = [
  cell(() => [beam(E(), E(), E())], ['eighth']),
  cell(() => [Q(true)], ['dotted']),
  cell(() => [beam(S(), S(), S(), S()), E()], ['sixteenth']),
  cell(() => [E(), beam(S(), S(), S(), S())], ['sixteenth']),
  cell(() => [rE(), beam(E(), E())], ['eighth']),
  cell(() => [beam(E(), E()), rE()], ['eighth']),
  cell(() => [beam(F(), F(), F(), F(), F(), F(), F(), F()), E()], ['fusa']),
  cell(() => [trS(), trS(), trS()], ['tripletS']),
  cell(() => [trE(), E()], ['tripletQE']),
  cell(() => [E(), trE()], ['tripletQE'])
];

// --- Celdas anchas (2, 3 y 4 tiempos) para compases simples ---
const CELLS_2 = [
  cell(() => [H()]),
  cell(() => [Q(true), E()], ['dotted']),
  cell(() => [E(), Q(true)], ['dotted']),
  cell(() => [trQ()], ['tripletQE'])
];
const CELLS_3 = [
  cell(() => [H(true)], ['dotted']),
  cell(() => [Q(), Q(true), E()], ['dotted']),
  cell(() => [Q(true), E(), Q()], ['dotted'])
];
const CELLS_4 = [
  cell(() => [W()]),
  cell(() => [trH()], ['tripletH'])
];

// Solo se puede elegir una unidad "ancha" (2, 3 o 4 tiempos) si el nivel tiene
// desbloqueada al menos una celda para ese tamaño (p.ej. el compas de 3 tiempos
// solo existe con puntillo). Size 1 y 2 y 4 siempre tienen una opcion base
// (negra, blanca, redonda), asi que nunca quedan sin opciones.
function partitionSimple(rng, total, wideBias, allowed) {
  const has3 = unlock(CELLS_3, allowed).length > 0;
  const units = [];
  let remaining = total;
  let first = true;
  while (remaining > 0) {
    let size;
    if (first && remaining === 4 && rng() < 0.05 * wideBias) {
      size = 4;
    } else {
      const r = rng();
      const p3 = remaining >= 3 && has3 ? 0.1 * wideBias : 0;
      const p2 = remaining >= 2 ? 0.28 * wideBias : 0;
      if (r < p3) size = 3;
      else if (r < p3 + p2) size = 2;
      else size = 1;
    }
    if (size > remaining) size = remaining;
    units.push(size);
    remaining -= size;
    first = false;
  }
  return units;
}

function poolForUnit(size, allowed) {
  const pool = size === 1 ? CELLS_1 : size === 2 ? CELLS_2 : size === 3 ? CELLS_3 : CELLS_4;
  return unlock(pool, allowed);
}

function genContent(rng, [num, den], allowedSet, boosts, wideBias) {
  if (den === 8) {
    const groups = EIGHT_GROUPING[num] || Array(Math.round(num / 2)).fill(2);
    let content = [];
    groups.forEach(g => {
      const pool = unlock(g === 3 ? CELLS_1_5 : CELLS_1, allowedSet);
      content = content.concat(pickCell(rng, pool, boosts));
    });
    return content;
  }
  let content = [];
  partitionSimple(rng, num, wideBias, allowedSet).forEach(size => {
    content = content.concat(pickCell(rng, poolForUnit(size, allowedSet), boosts));
  });
  return content;
}

function tokenSig(t) { return `${t.kind[0]}${t.base}${t.dotted ? 'd' : ''}`; }
function fingerprint(content) {
  return content.map(item => (
    item.kind === 'group'
      ? `[${item.tokens.map(tokenSig).join(',')}]${item.tuplet ? 't' : ''}`
      : tokenSig(item)
  )).join('|');
}

// Cada ejercicio recibe una "personalidad" propia: algunos insisten mas en
// tresillos, otros en fusas, otros en sincopas... para que se note la
// diferencia entre ejercicios de un mismo nivel, sobre todo en los niveles
// con mas figuras desbloqueadas.
function exercisePersonality(rng, allowedTags, boosts) {
  const personal = {};
  allowedTags.forEach(tag => {
    const base = boosts[tag] || 1;
    personal[tag] = base * (0.45 + rng() * 1.55); // ~0.45x - 2x del peso base
  });
  return personal;
}

/**
 * Genera `count` ejercicios independientes, cada uno con `measuresPerExercise`
 * compases (por defecto 20). Salvo que `mixedSig` sea true, cada ejercicio
 * mantiene un unico compas del principio al final (uno en 4/4, otro en 7/8...).
 * `allowedTags` controla que figuras estan desbloqueadas en el nivel.
 */
export function generateExercises({
  seed, count, measuresPerExercise = 20, meters, allowedTags = [], boosts = {},
  wideBias = 0.4, mixedSig = false
}) {
  const rng = mulberry32(seed);
  const allowedSet = new Set(allowedTags);
  const sigs = meters.map(m => m.sig);
  const weights = meters.map(m => m.w);
  const exercises = [];

  for (let e = 0; e < count; e++) {
    const exerciseSig = pickWeighted(rng, sigs, weights);
    const exerciseBoosts = exercisePersonality(rng, allowedTags, boosts);
    const exerciseWideBias = Math.min(0.9, Math.max(0.08, wideBias * (0.55 + rng() * 0.9)));
    const measures = [];
    const seen = new Set(); // evita repetir el mismo compas dentro de un ejercicio
    let guard = 0;
    while (measures.length < measuresPerExercise && guard < measuresPerExercise * 40) {
      guard++;
      const sig = mixedSig ? pickWeighted(rng, sigs, weights) : exerciseSig;
      const content = genContent(rng, sig, allowedSet, exerciseBoosts, exerciseWideBias);
      const key = `${sig.join('/')}::${fingerprint(content)}`;
      if (seen.has(key) && guard < measuresPerExercise * 30) continue;
      seen.add(key);
      measures.push({ sig, content });
    }
    exercises.push({
      title: `Ejercicio ${e + 1}`,
      sig: mixedSig ? null : exerciseSig,
      measures
    });
  }

  return exercises;
}
