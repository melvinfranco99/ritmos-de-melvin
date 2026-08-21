// Motor de audio: instrumentos de percusion sintetizados (caja, bombo,
// hi-hat/ride, toms, crash) + metronomo + reproduccion de un ejercicio.

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
    const len = c.sampleRate * 1.2;
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

function scheduleKick(time, nodes) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.22);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + 0.3);
  nodes.push(osc);

  noiseBurst(time, 0.02, 'bandpass', 1800, 0.35, nodes, 0.8);
}

function scheduleHihat(time, nodes, open = false) {
  noiseBurst(time, open ? 0.3 : 0.075, 'highpass', 7500, 0.45, nodes);
}

function scheduleCrash(time, nodes) {
  noiseBurst(time, 1.1, 'highpass', 3500, 0.5, nodes);
}

function scheduleTom(freqStart, freqEnd, time, nodes) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freqStart, time);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, time + 0.22);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + 0.3);
  nodes.push(osc);
}

function scheduleHit(instrument, time, nodes) {
  switch (instrument) {
    case 'kick': return scheduleKick(time, nodes);
    case 'hihat': return scheduleHihat(time, nodes);
    case 'crash': return scheduleCrash(time, nodes);
    case 'tom1': return scheduleTom(230, 165, time, nodes);
    case 'tom2': return scheduleTom(165, 120, time, nodes);
    case 'tom3': return scheduleTom(115, 82, time, nodes);
    case 'snare':
    default: return scheduleSnare(time, nodes);
  }
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

export class Player {
  constructor() {
    this.playing = false;
    this.nodes = [];
    this.timeouts = [];
    this.rafId = null;
    this.onNoteChange = null;
    this.onEnd = null;
  }

  isPlaying() {
    return this.playing;
  }

  stop() {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    const now = ctx ? ctx.currentTime : 0;
    this.nodes.forEach(n => { try { n.stop(now); } catch (e) { /* ya detenido */ } });
    this.nodes = [];
    if (this.onNoteChange) this.onNoteChange([]);
  }

  play({ events, totalBeats, clickBeats, bpm, metronome, onNoteChange, onEnd, onCountIn }) {
    this.stop();
    const c = getCtx();
    c.resume();
    this.onNoteChange = onNoteChange;
    this.onEnd = onEnd;

    const secPerBeat = 60 / bpm;
    const leadIn = 0.12;
    const countInStart = c.currentTime + leadIn;
    const nodes = [];

    // 4 golpes de metronomo de referencia antes de empezar el ejercicio
    for (let b = 0; b < COUNT_IN_BEATS; b++) {
      scheduleClick(countInStart + b * secPerBeat, b === 0, nodes);
    }
    const startTime = countInStart + COUNT_IN_BEATS * secPerBeat;

    events.forEach(ev => {
      if (ev.kind === 'note') {
        scheduleHit(ev.instrument, startTime + ev.absStart * secPerBeat, nodes);
      }
    });

    if (metronome) {
      clickBeats.forEach(cb => scheduleClick(startTime + cb.beat * secPerBeat, cb.accent, nodes));
    }

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
