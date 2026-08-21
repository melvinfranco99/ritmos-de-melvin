import { W, H, Q, E, S, F, rQ, rE, beam } from './notes.js';

// 10 niveles x 6 compases en 4/4. Cada compas suma exactamente 4 negras.
// Progresion: redonda/blanca/negra -> corcheas -> puntillo -> semicorcheas -> combinaciones -> fusas -> mezcla final.

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
      [rQ(), Q(), H()]
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
      [Q(), beam(E(), E()), beam(E(), E()), Q()]
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
      [rQ(), beam(E(), E()), Q(), beam(E(), rE())]
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
      [Q(true), E(), H()]
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
      [Q(), Q(true), E(), Q()]
    ]
  },
  {
    id: 6,
    color: '#d98a3d',
    resumen: 'Llegan las semicorcheas',
    measures: [
      [beam(S(), S(), S(), S()), Q(), beam(E(), E()), Q()],
      [Q(), beam(S(), S(), S(), S()), Q(), Q()],
      [beam(E(), E()), beam(S(), S(), S(), S()), Q(), Q()],
      [beam(S(), S(), S(), S()), beam(S(), S(), S(), S()), Q(), Q()],
      [Q(), Q(), beam(S(), S(), S(), S()), beam(E(), E())],
      [beam(S(), S(), S(), S()), beam(E(), E()), beam(S(), S(), S(), S()), Q()]
    ]
  },
  {
    id: 7,
    color: '#de6f3d',
    resumen: 'Corchea + dos semicorcheas',
    measures: [
      [beam(E(), S(), S()), Q(), beam(S(), S(), E()), Q()],
      [beam(S(), S(), E()), beam(E(), S(), S()), Q(), Q()],
      [Q(), beam(E(), S(), S()), beam(S(), S(), E()), Q()],
      [beam(S(), S(), S(), S()), beam(E(), S(), S()), Q(), Q()],
      [beam(E(), S(), S()), beam(S(), S(), E()), beam(S(), S(), S(), S()), Q()],
      [Q(), beam(S(), S(), E()), beam(E(), S(), S()), beam(E(), E())]
    ]
  },
  {
    id: 8,
    color: '#e35a4d',
    resumen: 'Corchea con puntillo y semicorchea',
    measures: [
      [beam(E(true), S()), Q(), beam(S(), E(true)), Q()],
      [beam(S(), E(true)), beam(E(true), S()), Q(), Q()],
      [Q(), beam(E(true), S()), beam(S(), S(), S(), S()), beam(S(), E(true))],
      [beam(E(true), S()), beam(S(), E(true)), beam(E(), S(), S()), Q()],
      [Q(true), E(), beam(E(true), S()), Q()],
      [H(true), beam(E(true), S())]
    ]
  },
  {
    id: 9,
    color: '#e2477a',
    resumen: 'Llegan las fusas',
    measures: [
      [beam(F(), F(), F(), F(), F(), F(), F(), F()), Q(), beam(S(), S(), S(), S()), Q()],
      [beam(S(), S(), S(), S()), beam(F(), F(), F(), F(), F(), F(), F(), F()), Q(), Q()],
      [Q(), beam(F(), F(), F(), F(), F(), F(), F(), F()), beam(E(), E()), Q()],
      [beam(F(), F(), F(), F(), F(), F(), F(), F()), beam(F(), F(), F(), F(), F(), F(), F(), F()), Q(), Q()],
      [beam(E(), S(), S()), beam(F(), F(), F(), F(), F(), F(), F(), F()), Q(), Q()],
      [Q(), beam(S(), S(), S(), S()), beam(F(), F(), F(), F(), F(), F(), F(), F()), beam(E(), E())]
    ]
  },
  {
    id: 10,
    color: '#a13fd6',
    resumen: 'Mezcla final: todas las figuras',
    measures: [
      [beam(S(true), F(), E()), Q(true), E(), Q()],
      [beam(F(), F(), F(), F(), F(), F(), F(), F()), beam(E(true), S()), Q(true), E()],
      [Q(true), E(), beam(S(), E(true)), Q()],
      [beam(F(), F(), F(), F(), F(), F(), F(), F()), beam(S(true), F(), E()), Q(true), E()],
      [H(true), beam(F(), F(), F(), F(), F(), F(), F(), F())],
      [beam(E(true), S()), beam(S(true), F(), E()), Q(true), E()]
    ]
  }
];
