// Instrumentos de bateria: orden de arriba a abajo en el pentagrama, con su
// posicion vertical relativa (en unidades del pentagrama) y la forma de su
// cabeza de nota. Los platillos (hi-hat, ride, crash) usan una "x".
export const INSTRUMENTS = {
  crash: { id: 'crash', label: 'Crash', shape: 'x', offset: -32 },
  hihat: { id: 'hihat', label: 'Hi-Hat / Ride', shape: 'x', offset: -24 },
  tom1: { id: 'tom1', label: 'Tom 1', shape: 'normal', offset: -16 },
  snare: { id: 'snare', label: 'Caja', shape: 'normal', offset: -8 },
  tom2: { id: 'tom2', label: 'Tom 2', shape: 'normal', offset: 0 },
  tom3: { id: 'tom3', label: 'Tom 3', shape: 'normal', offset: 8 },
  kick: { id: 'kick', label: 'Bombo', shape: 'normal', offset: 16 }
};

// Orden fijo (de arriba a abajo) para dibujar y para la leyenda
export const INSTRUMENT_ORDER = ['crash', 'hihat', 'tom1', 'snare', 'tom2', 'tom3', 'kick'];
