// Motor de audio: caja (snare) sintetizada + metronomo + reproduccion de un ejercicio.

let ctx = null;
let master = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  return ctx;
}

let noiseBuffer = null;
function getNoiseBuffer() {
  if (!noiseBuffer) {
    const c = getCtx();
    const len = c.sampleRate * 0.25;
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function noiseBurst(time, dur, filterType, freq, peakGain, nodes, q) {
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  if (q != null) filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(peakGain, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(time);
  src.stop(time + dur + 0.02);
  nodes.push(src);
}

function scheduleSnare(time, nodes) {
  noiseBurst(time, 0.16, 'highpass', 900, 1.0, nodes);

  const c = getCtx();
  const body = c.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(190, time);
  body.frequency.exponentialRampToValueAtTime(140, time + 0.08);
  const bodyGain = c.createGain();
  bodyGain.gain.setValueAtTime(0.6, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);
  body.connect(bodyGain);
  bodyGain.connect(master);
  body.start(time);
  body.stop(time + 0.1);
  nodes.push(body);
}

function scheduleClick(time, accent, nodes) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = accent ? 1600 : 1000;
  const gain = c.createGain();
  gain.gain.setValueAtTime(accent ? 0.45 : 0.28, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + 0.05);
  nodes.push(osc);
}

const COUNT_IN_BEATS = 4;

// --- Voz que cuenta los pulsos (clips grabados "one", "two"...) ---
// Se usan clips de audio pregrabados en vez de speechSynthesis: la API de
// voz del navegador es asincrona y con latencia variable, por lo que no se
// puede sincronizar con precision al clic del metronomo. Los clips, en
// cambio, se programan con el mismo reloj de Web Audio que el clic y las
// notas, con precision de muestra.
const COUNT_FILES = 8;
let countBuffersPromise = null;
function getCountBuffers() {
  if (!countBuffersPromise) {
    const c = getCtx();
    countBuffersPromise = Promise.all(
      Array.from({ length: COUNT_FILES }, (_, i) =>
        fetch(`sounds/count/${i + 1}.wav`)
          .then(res => res.arrayBuffer())
          .then(buf => c.decodeAudioData(buf))
      )
    );
  }
  return countBuffersPromise;
}

function scheduleCountVoice(time, n, buffers, nodes) {
  const buf = buffers[n - 1];
  if (!buf) return;
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.value = 0.85;
  src.connect(gain);
  gain.connect(master);
  src.start(time);
  nodes.push(src);
}

export class Player {
  constructor() {
    this.playing = false;
    this.nodes = [];
    this.timeouts = [];
    this.rafId = null;
    this.onNoteChange = null;
    this.onEnd = null;
    this.playToken = 0;
  }

  isPlaying() {
    return this.playing;
  }

  stop() {
    this.playing = false;
    this.playToken++;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    const now = ctx ? ctx.currentTime : 0;
    this.nodes.forEach(n => { try { n.stop(now); } catch (e) { /* ya detenido */ } });
    this.nodes = [];
    if (this.onNoteChange) this.onNoteChange([]);
  }

  async play({ events, totalBeats, clickBeats, bpm, metronomeMode, onNoteChange, onEnd, onCountIn }) {
    this.stop();
    const token = this.playToken;
    const c = getCtx();
    c.resume();
    this.onNoteChange = onNoteChange;
    this.onEnd = onEnd;

    const doClick = metronomeMode === 'click' || metronomeMode === 'both';
    const doVoice = metronomeMode === 'voice' || metronomeMode === 'both';
    const countBuffers = doVoice ? await getCountBuffers() : null;
    if (token !== this.playToken) return; // se detuvo/relanzo mientras cargaban los clips

    const secPerBeat = 60 / bpm;
    const leadIn = 0.12;
    const countInStart = c.currentTime + leadIn;
    const nodes = [];

    // 4 golpes de metronomo de referencia antes de empezar el ejercicio
    // (el count-in usa siempre un clic, para marcar el tempo con claridad,
    // y ademas la voz si el modo elegido la incluye)
    for (let b = 0; b < COUNT_IN_BEATS; b++) {
      const t = countInStart + b * secPerBeat;
      scheduleClick(t, b === 0, nodes);
      if (doVoice) scheduleCountVoice(t, b + 1, countBuffers, nodes);
    }
    const startTime = countInStart + COUNT_IN_BEATS * secPerBeat;

    events.forEach(ev => {
      if (ev.kind === 'note') {
        scheduleSnare(startTime + ev.absStart * secPerBeat, nodes);
      }
    });

    // Clic y voz de cada pulso se programan juntos, en el mismo reloj de
    // Web Audio, para que sean exactamente el mismo evento sonoro (la voz
    // reinicia en "one" en cada compas nuevo).
    let pulse = 0;
    clickBeats.forEach(cb => {
      const t = startTime + cb.beat * secPerBeat;
      if (doClick) scheduleClick(t, cb.accent, nodes);
      if (doVoice) {
        pulse = cb.accent ? 1 : pulse + 1;
        scheduleCountVoice(t, pulse, countBuffers, nodes);
      }
    });

    this.nodes = nodes;
    this.playing = true;

    if (onCountIn) {
      for (let b = 0; b < COUNT_IN_BEATS; b++) {
        const id = setTimeout(() => { if (this.playing) onCountIn(b); }, (leadIn + b * secPerBeat) * 1000);
        this.timeouts.push(id);
      }
      const doneId = setTimeout(() => { if (this.playing) onCountIn(-1); }, (leadIn + COUNT_IN_BEATS * secPerBeat) * 1000);
      this.timeouts.push(doneId);
    }

    const endTime = startTime + totalBeats * secPerBeat;
    const tick = () => {
      if (!this.playing) return;
      const now = c.currentTime;
      if (now >= endTime) {
        this.playing = false;
        if (this.onNoteChange) this.onNoteChange([]);
        if (this.onEnd) this.onEnd();
        return;
      }
      const elapsedBeats = (now - startTime) / secPerBeat;
      const current = events.filter(ev => elapsedBeats >= ev.absStart && elapsedBeats < ev.absStart + ev.dur);
      if (this.onNoteChange) this.onNoteChange(current);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
