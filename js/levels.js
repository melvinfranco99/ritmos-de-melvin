import { generateExercises } from './generator.js';

// Progresion: redonda/blanca/negra -> corcheas -> puntillo -> semicorcheas ->
// tresillos y compases nuevos (3/4, 6/8...) -> mezcla final.
//
// Cada nivel se compone de "ejercicios" independientes (>= 25 compases cada
// uno), generados de forma determinista (misma seed => mismo resultado
// siempre). Todo ejercicio, incluido el nivel 10, mantiene un unico compas
// de principio a fin: lo que varia entre niveles altos es que cada ejercicio
// puede tener un compas distinto (uno entero en 4/4, otro en 7/4...).

export const LEVELS = [
  {
    id: 1,
    color: '#3fb56d',
    resumen: 'Redondas, blancas y negras',
    exercises: generateExercises({
      seed: 100001,
      count: 10,
      meters: [{ sig: [4, 4], w: 1 }],
      allowedTags: [],
      wideBias: 0.8
    })
  },
  {
    id: 2,
    color: '#5fb84f',
    resumen: 'Se incorporan las corcheas',
    exercises: generateExercises({
      seed: 200002,
      count: 10,
      meters: [{ sig: [4, 4], w: 1 }],
      allowedTags: ['eighth'],
      wideBias: 0.55
    })
  },
  {
    id: 3,
    color: '#8bbf3f',
    resumen: 'Corcheas y silencios de corchea',
    exercises: generateExercises({
      seed: 300003,
      count: 10,
      meters: [{ sig: [4, 4], w: 1 }],
      allowedTags: ['eighth'],
      wideBias: 0.3
    })
  },
  {
    id: 4,
    color: '#c2c93f',
    resumen: 'Blanca y negra con puntillo',
    exercises: generateExercises({
      seed: 400004,
      count: 10,
      meters: [{ sig: [4, 4], w: 1 }],
      allowedTags: ['eighth', 'dotted'],
      wideBias: 0.5
    })
  },
  {
    id: 5,
    color: '#d1a83f',
    resumen: 'Puntillos y corcheas combinadas',
    exercises: generateExercises({
      seed: 500005,
      count: 10,
      meters: [{ sig: [4, 4], w: 1 }],
      allowedTags: ['eighth', 'dotted'],
      wideBias: 0.28
    })
  },
  {
    id: 6,
    color: '#d98a3d',
    resumen: 'Semicorcheas, primeros tresillos y compas de 3/4',
    exercises: generateExercises({
      seed: 600006,
      count: 10,
      meters: [{ sig: [4, 4], w: 0.75 }, { sig: [3, 4], w: 0.25 }],
      allowedTags: ['eighth', 'dotted', 'sixteenth', 'tripletQE'],
      boosts: { tripletQE: 0.7 },
      wideBias: 0.32
    })
  },
  {
    id: 7,
    color: '#de6f3d',
    resumen: 'Tresillos de corchea/semicorchea y compases de 3/4 y 6/8',
    exercises: generateExercises({
      seed: 700007,
      count: 10,
      meters: [{ sig: [4, 4], w: 0.5 }, { sig: [3, 4], w: 0.25 }, { sig: [6, 8], w: 0.25 }],
      allowedTags: ['eighth', 'dotted', 'sixteenth', 'tripletQE', 'mixedEighthSixteenth', 'tripletS'],
      boosts: { tripletQE: 0.8, tripletS: 0.8 },
      wideBias: 0.28
    })
  },
  {
    id: 8,
    color: '#e35a4d',
    resumen: '50 ejercicios: tresillos y compases de 3/4 y 6/8',
    exercises: generateExercises({
      seed: 800008,
      count: 50,
      meters: [{ sig: [4, 4], w: 0.5 }, { sig: [3, 4], w: 0.3 }, { sig: [6, 8], w: 0.2 }],
      allowedTags: [
        'eighth', 'dotted', 'sixteenth', 'tripletQE', 'mixedEighthSixteenth', 'tripletS',
        'dottedEighth'
      ],
      boosts: { tripletQE: 1, tripletS: 1 },
      wideBias: 0.25
    })
  },
  {
    id: 9,
    color: '#e2477a',
    resumen: '50 ejercicios: mas tresillos y compases de 7/8 y 5/8',
    exercises: generateExercises({
      seed: 900009,
      count: 50,
      meters: [
        { sig: [4, 4], w: 0.22 }, { sig: [3, 4], w: 0.18 }, { sig: [6, 8], w: 0.2 },
        { sig: [7, 8], w: 0.2 }, { sig: [5, 8], w: 0.2 }
      ],
      allowedTags: [
        'eighth', 'dotted', 'sixteenth', 'tripletQE', 'mixedEighthSixteenth', 'tripletS',
        'dottedEighth'
      ],
      boosts: { tripletQE: 1.4, tripletS: 1.4 },
      wideBias: 0.22
    })
  },
  {
    id: 10,
    color: '#a13fd6',
    resumen: 'Nivel maestro: 50 ejercicios con todo, incluidos compases de 5/4 y 7/4',
    exercises: generateExercises({
      seed: 101010,
      count: 50,
      meters: [
        { sig: [4, 4], w: 0.14 }, { sig: [3, 4], w: 0.14 }, { sig: [6, 8], w: 0.14 },
        { sig: [7, 8], w: 0.14 }, { sig: [5, 8], w: 0.12 }, { sig: [5, 4], w: 0.16 },
        { sig: [7, 4], w: 0.16 }
      ],
      allowedTags: [
        'eighth', 'dotted', 'sixteenth', 'tripletQE', 'mixedEighthSixteenth', 'tripletS',
        'dottedEighth', 'tripletH'
      ],
      boosts: { tripletQE: 2, tripletS: 2, tripletH: 1.5 },
      wideBias: 0.2
    })
  }
];
