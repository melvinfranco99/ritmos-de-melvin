// Generador determinista de ejercicios para los niveles avanzados (8, 9 y 10).
// Con la misma seed siempre produce el mismo resultado, para que la web sea
// estable entre visitas y se pueda validar (los compases siempre cuadran).
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

function pickCell(rng, pool, boosts) {
  const weights = pool.map(e => e.tags.reduce((w, t) => w * (boosts[t] || 1), 1));
  const entry = pickWeighted(rng, pool, weights);
  return entry.factory();
}

// --- Celdas de 1 tiempo (grid de negra), usadas en compases simples y como
// "corcheas cortas" (grupos de 2) dentro de compases compuestos ---
const CELLS_1 = [
  cell(() => [Q()]),
  cell(() => [rQ()]),
  cell(() => [beam(E(), E())]),
  cell(() => [beam(E(), rE())]),
  cell(() => [beam(rE(), E())]),
  cell(() => [beam(S(), S(), S(), S())]),
  cell(() => [beam(E(), S(), S())]),
  cell(() => [beam(S(), S(), E())]),
  cell(() => [beam(E(true), S())]),
  cell(() => [beam(S(), E(true))]),
  cell(() => [beam(F(), F(), F(), F(), F(), F(), F(), F())], ['fusa']),
  cell(() => [trE()], ['triplet']),
  cell(() => [trE(['note', 'note', 'rest'])], ['triplet']),
  cell(() => [trE(['note', 'rest', 'note'])], ['triplet']),
  cell(() => [trS(), trS()], ['triplet']),
  cell(() => [trS(), E()], ['triplet']),
  cell(() => [E(), trS()], ['triplet'])
];

// --- Celdas de 1.5 tiempos (corchea con puntillo = grupo de 3 corcheas),
// el "tiempo" natural de los compases compuestos (6/8, 7/8, 5/8) ---
const CELLS_1_5 = [
  cell(() => [beam(E(), E(), E())]),
  cell(() => [Q(true)]),
  cell(() => [beam(S(), S(), S(), S()), E()]),
  cell(() => [E(), beam(S(), S(), S(), S())]),
  cell(() => [rE(), beam(E(), E())]),
  cell(() => [beam(E(), E()), rE()]),
  cell(() => [beam(F(), F(), F(), F(), F(), F(), F(), F()), E()], ['fusa']),
  cell(() => [trS(), trS(), trS()], ['triplet']),
  cell(() => [trE(), E()], ['triplet']),
  cell(() => [E(), trE()], ['triplet'])
];

// --- Celdas "anchas" para compases simples (2, 3 y 4 tiempos) ---
const CELLS_2 = [
  cell(() => [H()]),
  cell(() => [Q(true), E()]),
  cell(() => [E(), Q(true)]),
  cell(() => [trQ()], ['triplet'])
];
const CELLS_3 = [
  cell(() => [H(true)]),
  cell(() => [Q(), Q(true), E()]),
  cell(() => [Q(true), E(), Q()])
];
const CELLS_4 = [
  cell(() => [W()]),
  cell(() => [trH()], ['triplet'])
];

function partitionSimple(rng, total) {
  const units = [];
  let remaining = total;
  let first = true;
  while (remaining > 0) {
    let size;
    if (first && remaining === 4 && rng() < 0.06) {
      size = 4;
    } else {
      const r = rng();
      if (remaining >= 3 && r < 0.12) size = 3;
      else if (remaining >= 2 && r < 0.42) size = 2;
      else size = 1;
    }
    if (size > remaining) size = remaining;
    units.push(size);
    remaining -= size;
    first = false;
  }
  return units;
}

function poolForUnit(size) {
  return size === 1 ? CELLS_1 : size === 2 ? CELLS_2 : size === 3 ? CELLS_3 : CELLS_4;
}

function genContent(rng, [num, den], boosts) {
  if (den === 8) {
    const groups = EIGHT_GROUPING[num] || Array(Math.round(num / 2)).fill(2);
    let content = [];
    groups.forEach(g => {
      const pool = g === 3 ? CELLS_1_5 : CELLS_1;
      content = content.concat(pickCell(rng, pool, boosts));
    });
    return content;
  }
  let content = [];
  partitionSimple(rng, num).forEach(size => {
    content = content.concat(pickCell(rng, poolForUnit(size), boosts));
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

/**
 * Genera `count` ejercicios distintos combinando los compases indicados en
 * `meters` (cada uno con su peso) y las figuras disponibles, incluyendo
 * tresillos y fusas segun `boosts`. El resultado es siempre el mismo para la
 * misma `seed`.
 */
export function generateLevel({ seed, count, meters, boosts = {} }) {
  const rng = mulberry32(seed);
  const sigs = meters.map(m => m.sig);
  const weights = meters.map(m => m.w);
  const seen = new Set();
  const results = [];
  let guard = 0;
  while (results.length < count && guard < count * 40) {
    guard++;
    const sig = pickWeighted(rng, sigs, weights);
    const content = genContent(rng, sig, boosts);
    const key = `${sig.join('/')}::${fingerprint(content)}`;
    if (seen.has(key) && guard < count * 30) continue;
    seen.add(key);
    results.push({ sig, content });
  }
  return results;
}
