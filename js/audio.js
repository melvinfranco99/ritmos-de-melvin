// Motor de audio: caja (snare) sintetizada + metronomo + reproduccion de un nivel completo.

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

function scheduleSnare(time, nodes) {
  const c = getCtx();

  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 900;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(1.0, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.16);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(time);
  noise.stop(time + 0.18);

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

  nodes.push(noise, body);
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
    if (this.onNoteChange) this.onNoteChange(null);
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
        scheduleSnare(startTime + ev.absStart * secPerBeat, nodes);
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
        if (this.onNoteChange) this.onNoteChange(null);
        if (this.onEnd) this.onEnd();
        return;
      }
      const elapsedBeats = (now - startTime) / secPerBeat;
      let current = null;
      for (const ev of events) {
        if (elapsedBeats >= ev.absStart && elapsedBeats < ev.absStart + ev.dur) { current = ev; break; }
      }
      if (this.onNoteChange) this.onNoteChange(current);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
