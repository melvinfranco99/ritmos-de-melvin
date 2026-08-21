// Niveles de bateria: patrones (grooves) coherentes, escritos a mano, que se
// repiten (tile) hasta completar el largo de cada ejercicio (maximo 10
// compases). Todos en 4/4. Progresion: bombo+caja+hi-hat -> mas sincopa ->
// primeros fills con tom1 (nivel 5) -> tom2 (nivel 6) -> tom3 (nivel 7) ->
// crash (nivel 8) -> grooves mas densos (niveles 9-10).

import { Q, E, S, rQ, rE, rS, rW, beam } from './notes.js';

const SIG = [4, 4];

function beats4(pattern) { return pattern.map(p => (p ? Q() : rQ())); }

// Agrupa cada pareja de corcheas de un patron de 8 corcheas (2 por tiempo)
function eighthsN(pattern) {
  const out = [];
  for (let i = 0; i < pattern.length; i += 2) {
    out.push(beam(pattern[i] ? E() : rE(), pattern[i + 1] ? E() : rE()));
  }
  return out;
}

function eighthPairsAll() { return [beam(E(), E()), beam(E(), E()), beam(E(), E()), beam(E(), E())]; }
function quietBar() { return [rW()]; }
function crashDownbeat() { return [Q(), rQ(), rQ(), rQ()]; }

// Contenido de una linea de tom durante el "relleno" (fill) del ultimo
// tiempo: silencio en los 3 primeros tiempos + el contenido de ese ultimo.
function fillLane(lastBeat) { return [rQ(), rQ(), rQ(), lastBeat]; }

function m(lanes) { return { sig: SIG, lanes }; }

function tile(unit, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(unit[i % unit.length]);
  return out;
}

function exercise(i, unit, count) {
  return { title: `Ejercicio ${i + 1}`, sig: unit[0].sig, measures: tile(unit, count) };
}

function buildLevel(patterns, buildUnit, counts) {
  return patterns.map((p, i) => exercise(i, buildUnit(p, i), counts[i] ?? counts[counts.length - 1]));
}

// ---------------------------------------------------------------------
// Nivel 1: un bombo y una caja por compas, hi-hat a negras
// ---------------------------------------------------------------------
const L1_PATTERNS = [
  { kick: [1, 0, 0, 0], snare: [0, 0, 1, 0] },
  { kick: [1, 0, 0, 0], snare: [0, 1, 0, 0] },
  { kick: [0, 0, 1, 0], snare: [1, 0, 0, 0] },
  { kick: [1, 0, 0, 0], snare: [0, 0, 0, 1] },
  { kick: [0, 1, 0, 0], snare: [0, 0, 0, 1] },
  { kick: [1, 0, 1, 0], snare: [0, 1, 0, 1] },
  { kick: [1, 0, 0, 1], snare: [0, 1, 0, 0] },
  { kick: [0, 0, 1, 0], snare: [0, 0, 0, 1] }
];

function buildL1(p) {
  return [m({ hihat: beats4([1, 1, 1, 1]), snare: beats4(p.snare), kick: beats4(p.kick) })];
}

// ---------------------------------------------------------------------
// Nivel 2: hi-hat en corcheas + primer backbeat (caja a 2 y 4)
// ---------------------------------------------------------------------
const L2_PATTERNS = [
  [1, 0, 1, 0], [1, 0, 0, 0], [1, 1, 0, 0], [1, 0, 0, 1],
  [0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 1, 0], [1, 0, 1, 0]
];

function buildL2(kick) {
  return [m({ hihat: eighthPairsAll(), snare: beats4([0, 1, 0, 1]), kick: beats4(kick) })];
}

// ---------------------------------------------------------------------
// Nivel 3: bombo sincopado a corcheas (grid de 8), caja a 2 y 4
// ---------------------------------------------------------------------
const L3_PATTERNS = [
  [1, 0, 0, 0, 0, 1, 0, 0],
  [1, 0, 0, 1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 0],
  [1, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 1, 1, 0, 0, 0],
  [1, 0, 0, 0, 1, 0, 0, 1]
];

function buildL3(kick8) {
  return [m({ hihat: eighthPairsAll(), snare: beats4([0, 1, 0, 1]), kick: eighthsN(kick8) })];
}

// ---------------------------------------------------------------------
// Nivel 4: groove de 2 compases distintos (A/B) para mas variedad
// ---------------------------------------------------------------------
const L4_PAIRS = [
  [[1, 0, 0, 0, 0, 1, 0, 0], [1, 0, 0, 1, 0, 0, 0, 0]],
  [[1, 0, 0, 1, 0, 0, 0, 0], [1, 0, 0, 0, 1, 0, 1, 0]],
  [[1, 0, 0, 0, 1, 0, 1, 0], [1, 0, 1, 0, 0, 0, 0, 1]],
  [[1, 0, 1, 0, 0, 0, 0, 1], [1, 1, 0, 0, 0, 1, 0, 0]],
  [[1, 1, 0, 0, 0, 1, 0, 0], [1, 0, 0, 1, 0, 0, 1, 0]],
  [[1, 0, 0, 1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 0, 0, 0]],
  [[1, 0, 1, 0, 1, 0, 0, 0], [1, 0, 0, 0, 0, 1, 0, 1]],
  [[1, 0, 0, 0, 0, 1, 0, 1], [1, 0, 0, 0, 0, 1, 0, 0]]
];

function buildL4([a, b]) {
  const meas = k => m({ hihat: eighthPairsAll(), snare: beats4([0, 1, 0, 1]), kick: eighthsN(k) });
  return [meas(a), meas(b)];
}

// ---------------------------------------------------------------------
// Nivel 5: primer relleno (fill) con Tom 1 en el ultimo tiempo
// ---------------------------------------------------------------------
const L5_KICKS = [
  [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [1, 1, 0, 0],
  [1, 0, 1, 0], [0, 1, 1, 0], [1, 1, 1, 0], [1, 0, 1, 0]
];

function buildL5(kick) {
  const groove = m({
    hihat: eighthPairsAll(), snare: beats4([0, 1, 0, 1]), kick: beats4(kick),
    tom1: quietBar()
  });
  const fill = m({
    hihat: [beam(E(), E()), beam(E(), E()), beam(E(), E()), rQ()],
    snare: beats4([0, 1, 0, 0]),
    kick: beats4(kick),
    tom1: fillLane(beam(E(), E()))
  });
  return [groove, fill];
}

// ---------------------------------------------------------------------
// Nivel 6: relleno con Tom 1 + Tom 2 (una corchea cada uno)
// ---------------------------------------------------------------------
function buildL6(kick) {
  const groove = m({
    hihat: eighthPairsAll(), snare: beats4([0, 1, 0, 1]), kick: beats4(kick),
    tom1: quietBar(), tom2: quietBar()
  });
  const fill = m({
    hihat: [beam(E(), E()), beam(E(), E()), beam(E(), E()), rQ()],
    snare: beats4([0, 1, 0, 0]),
    kick: beats4(kick),
    tom1: fillLane(beam(E(), rE())),
    tom2: fillLane(beam(rE(), E()))
  });
  return [groove, fill];
}

// ---------------------------------------------------------------------
// Nivel 7: relleno descendente Tom1 -> Tom2 -> Tom3 -> bombo (semicorcheas)
// ---------------------------------------------------------------------
function buildL7(kick) {
  const groove = m({
    hihat: eighthPairsAll(), snare: beats4([0, 1, 0, 1]), kick: beats4(kick),
    tom1: quietBar(), tom2: quietBar(), tom3: quietBar()
  });
  const fill = m({
    hihat: [beam(E(), E()), beam(E(), E()), beam(E(), E()), rQ()],
    snare: beats4([0, 1, 0, 0]),
    kick: [...beats4(kick).slice(0, 3), beam(rS(), rS(), rS(), S())],
    tom1: fillLane(beam(S(), rS(), rS(), rS())),
    tom2: fillLane(beam(rS(), S(), rS(), rS())),
    tom3: fillLane(beam(rS(), rS(), S(), rS()))
  });
  return [groove, fill];
}

// ---------------------------------------------------------------------
// Nivel 8: llega el crash (en el primer tiempo del compas con groove);
// el bombo del compas con groove pasa a corcheas sincopadas
// ---------------------------------------------------------------------
const L8_KICKS = [
  [1, 0, 0, 0, 0, 1, 0, 0],
  [1, 0, 0, 1, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 1, 0, 0],
  [1, 0, 1, 0, 0, 0, 0, 0],
  [1, 0, 0, 1, 1, 0, 0, 0],
  [1, 1, 0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 0, 1, 0, 0],
  [1, 0, 0, 0, 1, 1, 0, 0]
];

function buildL8(kick8) {
  const groove = m({
    hihat: eighthPairsAll(), snare: beats4([0, 1, 0, 1]), kick: eighthsN(kick8),
    tom1: quietBar(), tom2: quietBar(), tom3: quietBar(), crash: crashDownbeat()
  });
  const fill = m({
    hihat: [beam(E(), E()), beam(E(), E()), beam(E(), E()), rQ()],
    snare: beats4([0, 1, 0, 0]),
    kick: [...eighthsN(kick8.slice(0, 6)), beam(rS(), rS(), rS(), S())],
    tom1: fillLane(beam(S(), rS(), rS(), rS())),
    tom2: fillLane(beam(rS(), S(), rS(), rS())),
    tom3: fillLane(beam(rS(), rS(), S(), rS())),
    crash: quietBar()
  });
  return [groove, fill];
}

// ---------------------------------------------------------------------
// Nivel 9: como el 8 pero con la caja tambien sincopada (golpe extra
// antes del relleno)
// ---------------------------------------------------------------------
function buildL9(kick8) {
  const snare8 = [0, 0, 1, 0, 0, 0, 1, 1];
  const groove = m({
    hihat: eighthPairsAll(), snare: eighthsN(snare8), kick: eighthsN(kick8),
    tom1: quietBar(), tom2: quietBar(), tom3: quietBar(), crash: crashDownbeat()
  });
  const fill = m({
    hihat: [beam(E(), E()), beam(E(), E()), beam(E(), E()), rQ()],
    snare: beats4([0, 1, 0, 0]),
    kick: [...eighthsN(kick8.slice(0, 6)), beam(rS(), rS(), rS(), S())],
    tom1: fillLane(beam(S(), rS(), rS(), rS())),
    tom2: fillLane(beam(rS(), S(), rS(), rS())),
    tom3: fillLane(beam(rS(), rS(), S(), rS())),
    crash: quietBar()
  });
  return [groove, fill];
}

// ---------------------------------------------------------------------
// Nivel 10: nivel maestro. Bombo y caja sincopados a la vez y el relleno
// alterna el orden de los toms (descendente / ascendente) segun el ejercicio
// ---------------------------------------------------------------------
function buildL10(kick8, i) {
  const snare8 = [0, 0, 1, 0, 1, 0, 1, 1];
  const ascending = i % 2 === 1;
  const groove = m({
    hihat: eighthPairsAll(), snare: eighthsN(snare8), kick: eighthsN(kick8),
    tom1: quietBar(), tom2: quietBar(), tom3: quietBar(), crash: crashDownbeat()
  });
  const t1 = beam(S(), rS(), rS(), rS());
  const t2 = beam(rS(), S(), rS(), rS());
  const t3 = beam(rS(), rS(), S(), rS());
  const fill = m({
    hihat: [beam(E(), E()), beam(E(), E()), beam(E(), E()), rQ()],
    snare: beats4([0, 1, 0, 0]),
    kick: [...eighthsN(kick8.slice(0, 6)), beam(rS(), rS(), rS(), S())],
    tom1: fillLane(ascending ? t3 : t1),
    tom2: fillLane(t2),
    tom3: fillLane(ascending ? t1 : t3),
    crash: quietBar()
  });
  return [groove, fill];
}

export const DRUM_LEVELS = [
  {
    id: 1, color: '#3fb56d', resumen: 'Bombo, caja y hi-hat: primeros patrones',
    exercises: buildLevel(L1_PATTERNS, buildL1, [4])
  },
  {
    id: 2, color: '#5fb84f', resumen: 'Hi-hat en corcheas y primer backbeat',
    exercises: buildLevel(L2_PATTERNS, buildL2, [4, 4, 4, 4, 6, 6, 6, 6])
  },
  {
    id: 3, color: '#8bbf3f', resumen: 'Bombo sincopado a corcheas',
    exercises: buildLevel(L3_PATTERNS, buildL3, [6])
  },
  {
    id: 4, color: '#c2c93f', resumen: 'Groove de 2 compases distintos',
    exercises: buildLevel(L4_PAIRS, buildL4, [8])
  },
  {
    id: 5, color: '#d1a83f', resumen: 'Primer relleno: entra el Tom 1',
    exercises: buildLevel(L5_KICKS, buildL5, [6, 6, 6, 6, 6, 6, 6, 8])
  },
  {
    id: 6, color: '#d98a3d', resumen: 'Relleno con Tom 1 + Tom 2',
    exercises: buildLevel(L5_KICKS, buildL6, [6, 6, 6, 6, 8, 8, 8, 8])
  },
  {
    id: 7, color: '#de6f3d', resumen: 'Relleno descendente Tom1-Tom2-Tom3',
    exercises: buildLevel(L5_KICKS, buildL7, [8])
  },
  {
    id: 8, color: '#e35a4d', resumen: 'Llega el crash, bombo mas sincopado',
    exercises: buildLevel(L8_KICKS, buildL8, [8, 8, 8, 8, 10, 10, 10, 10])
  },
  {
    id: 9, color: '#e2477a', resumen: 'Caja y bombo sincopados a la vez',
    exercises: buildLevel(L8_KICKS, buildL9, [10])
  },
  {
    id: 10, color: '#a13fd6', resumen: 'Nivel maestro: groove completo con relleno variable',
    exercises: buildLevel(L8_KICKS, buildL10, [10])
  }
];
