import { W, H, Q, E, S, F, rQ, rE, beam, trH, trQ, trE, trS } from './notes.js';
import { generateLevel } from './generator.js';

// Progresion: redonda/blanca/negra -> corcheas -> puntillo -> semicorcheas -> combinaciones ->
// tresillos y compases nuevos (3/4, 6/8...) -> fusas -> mezcla final con muchos compases distintos.
// Cada compas (o su version { sig, content }) suma exactamente los tiempos de su indicador.

export const LEVELS = [
  {
    id: 1,
    color: '#3fb56d',
    resumen: 'Redondas, blancas y negras',
    measures: [
      [W()],
      [H(), H()],
      [Q(), Q(), H()],
      [H(), Q(), Q()],
      [Q(), Q(), Q(), Q()],
      [rQ(), Q(), H()],
      [Q(), H(), Q()],
      [rQ(), H(), Q()],
      [H(), rQ(), Q()],
      [Q(), Q(), rQ(), Q()]
    ]
  },
  {
    id: 2,
    color: '#5fb84f',
    resumen: 'Se incorporan las corcheas',
    measures: [
      [Q(), beam(E(), E()), Q(), Q()],
      [beam(E(), E()), beam(E(), E()), Q(), Q()],
      [H(), beam(E(), E()), Q()],
      [Q(), rQ(), beam(E(), E()), Q()],
      [beam(E(), E()), Q(), rQ(), beam(E(), E())],
      [Q(), beam(E(), E()), beam(E(), E()), Q()],
      [beam(E(), E()), Q(), Q(), rQ()],
      [Q(), beam(E(), E()), rQ(), Q()],
      [H(), Q(), beam(E(), E())],
      [beam(E(), E()), beam(E(), E()), beam(E(), E()), Q()]
    ]
  },
  {
    id: 3,
    color: '#8bbf3f',
    resumen: 'Corcheas y silencios de corchea',
    measures: [
      [beam(E(), rE()), Q(), beam(E(), E()), Q()],
      [beam(rE(), E()), beam(E(), E()), Q(), Q()],
      [beam(E(), E()), beam(E(), rE()), beam(E(), E()), Q()],
      [Q(), beam(rE(), E()), beam(E(), rE()), Q()],
      [beam(E(), E()), beam(E(), E()), beam(E(), E()), Q()],
      [rQ(), beam(E(), E()), Q(), beam(E(), rE())],
      [beam(E(), rE()), beam(rE(), E()), beam(E(), E()), Q()],
      [Q(), beam(E(), rE()), Q(), beam(rE(), E())],
      [beam(E(), E()), rQ(), beam(E(), rE()), Q()],
      [beam(rE(), E()), beam(E(), E()), beam(rE(), E()), Q()]
    ]
  },
  {
    id: 4,
    color: '#c2c93f',
    resumen: 'Blanca y negra con puntillo',
    measures: [
      [H(true), Q()],
      [Q(true), E(), Q(), Q()],
      [Q(), Q(true), E(), Q()],
      [beam(E(), E()), Q(true), E(), Q()],
      [H(true), beam(E(), E())],
      [Q(true), E(), H()],
      [Q(), Q(true), E(), Q()],
      [Q(), H(true)],
      [Q(true), E(), Q(true), E()],
      [Q(), Q(), Q(true), E()]
    ]
  },
  {
    id: 5,
    color: '#d1a83f',
    resumen: 'Puntillos y corcheas combinadas',
    measures: [
      [beam(rE(), E()), Q(true), E(), Q()],
      [Q(), beam(E(), E()), Q(true), E()],
      [beam(E(), E()), beam(E(), E()), Q(true), E()],
      [Q(true), E(), beam(E(), E()), Q()],
      [beam(rE(), E()), beam(E(), rE()), Q(true), E()],
      [Q(), Q(true), E(), Q()],
      [Q(true), E(), beam(E(), E()), Q()],
      [rQ(), Q(true), E(), Q()],
      [beam(rE(), E()), Q(), Q(true), E()],
      [Q(true), E(), rQ(), Q()]
    ]
  },
  {
    id: 6,
    color: '#d98a3d',
    resumen: 'Semicorcheas y primeros tresillos',
    measures: [
      [beam(S(), S(), S(), S()), Q(), beam(E(), E()), Q()],
      [Q(), beam(S(), S(), S(), S()), Q(), Q()],
      [beam(E(), E()), beam(S(), S(), S(), S()), Q(), Q()],
      [beam(S(), S(), S(), S()), beam(S(), S(), S(), S()), Q(), Q()],
      [Q(), Q(), beam(S(), S(), S(), S()), beam(E(), E())],
      [beam(S(), S(), S(), S()), beam(E(), E()), beam(S(), S(), S(), S()), Q()],
      [Q(), beam(S(), S(), S(), S()), beam(E(), E()), Q()],
      [trE(), Q(), beam(S(), S(), S(), S()), Q()],
      [trQ(), Q(), Q()],
      { sig: [3, 4], content: [beam(S(), S(), S(), S()), Q(), Q()] }
    ]
  },
  {
    id: 7,
    color: '#de6f3d',
    resumen: 'Tresillos de corchea/semicorchea y compases de 3/4 y 6/8',
    measures: [
      [beam(E(), S(), S()), Q(), beam(S(), S(), E()), Q()],
      [beam(S(), S(), E()), beam(E(), S(), S()), Q(), Q()],
      [Q(), beam(E(), S(), S()), beam(S(), S(), E()), Q()],
      [beam(S(), S(), S(), S()), beam(E(), S(), S()), Q(), Q()],
      [beam(E(), S(), S()), beam(S(), S(), E()), beam(S(), S(), S(), S()), Q()],
      [Q(), beam(S(), S(), E()), beam(E(), S(), S()), beam(E(), E())],
      [trS(), trS(), Q(), beam(S(), S(), S(), S()), Q()],
      { sig: [6, 8], content: [beam(E(), E(), E()), beam(E(), E(), E())] },
      [trE(['note', 'rest', 'note']), beam(S(), S(), E()), Q(), Q()],
      { sig: [3, 4], content: [trQ(), Q()] }
    ]
  },
  {
    id: 8,
    color: '#e35a4d',
    resumen: '50 ejercicios: corchea con puntillo, fusas, tresillos, 3/4 y 6/8',
    measures: generateLevel({
      seed: 800008,
      count: 50,
      meters: [
        { sig: [4, 4], w: 0.5 },
        { sig: [3, 4], w: 0.3 },
        { sig: [6, 8], w: 0.2 }
      ],
      boosts: { triplet: 1.0, fusa: 0.8 }
    })
  },
  {
    id: 9,
    color: '#e2477a',
    resumen: '50 ejercicios: mas tresillos y compases de 7/8 y 5/8',
    measures: generateLevel({
      seed: 900009,
      count: 50,
      meters: [
        { sig: [4, 4], w: 0.22 },
        { sig: [3, 4], w: 0.18 },
        { sig: [6, 8], w: 0.2 },
        { sig: [7, 8], w: 0.2 },
        { sig: [5, 8], w: 0.2 }
      ],
      boosts: { triplet: 1.6, fusa: 1.1 }
    })
  },
  {
    id: 10,
    color: '#a13fd6',
    resumen: 'Nivel maestro: 50 ejercicios con todo, incluidos compases de 5/4 y 7/4',
    measures: generateLevel({
      seed: 101010,
      count: 50,
      meters: [
        { sig: [4, 4], w: 0.14 },
        { sig: [3, 4], w: 0.14 },
        { sig: [6, 8], w: 0.14 },
        { sig: [7, 8], w: 0.14 },
        { sig: [5, 8], w: 0.12 },
        { sig: [5, 4], w: 0.16 },
        { sig: [7, 4], w: 0.16 }
      ],
      boosts: { triplet: 2.3, fusa: 1.4 }
    })
  }
];
