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

// --- Voz de fondo que cuenta los pulsos ("one", "two"...) sobre cada pitido ---
const COUNT_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

let cachedVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  cachedVoice = voices.find(v => /en-US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || voices[0];
  return cachedVoice;
}

function speakCount(n) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(COUNT_WORDS[n - 1] || String(n));
  utter.lang = 'en-US';
  utter.rate = 1.1;
  utter.pitch = 1;
  utter.volume = 0.55;
  const voice = cachedVoice || pickVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}

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
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (this.onNoteChange) this.onNoteChange([]);
  }

  play({ events, totalBeats, clickBeats, bpm, metronomeMode, onNoteChange, onEnd, onCountIn }) {
    this.stop();
    const c = getCtx();
    c.resume();
    this.onNoteChange = onNoteChange;
    this.onEnd = onEnd;

    const doClick = metronomeMode === 'click' || metronomeMode === 'both';
    const doVoice = metronomeMode === 'voice' || metronomeMode === 'both';

    const secPerBeat = 60 / bpm;
    const leadIn = 0.12;
    const countInStart = c.currentTime + leadIn;
    const nodes = [];

    // 4 golpes de metronomo de referencia antes de empezar el ejercicio
    // (el count-in usa siempre un clic, para marcar el tempo con claridad)
    for (let b = 0; b < COUNT_IN_BEATS; b++) {
      scheduleClick(countInStart + b * secPerBeat, b === 0, nodes);
    }
    const startTime = countInStart + COUNT_IN_BEATS * secPerBeat;

    events.forEach(ev => {
      if (ev.kind === 'note') {
        scheduleSnare(startTime + ev.absStart * secPerBeat, nodes);
      }
    });

    if (doClick) {
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

    // Voz contando cada pulso: "one, two, three, four..." durante el
    // count-in, y reiniciando en "one" en cada compas durante el ejercicio.
    // Solo suena si el modo de metronomo elegido incluye voz.
    if (doVoice) {
      pickVoice();
      for (let b = 0; b < COUNT_IN_BEATS; b++) {
        const id = setTimeout(() => { if (this.playing) speakCount(b + 1); }, (leadIn + b * secPerBeat) * 1000);
        this.timeouts.push(id);
      }
      let pulse = 0;
      clickBeats.forEach(cb => {
        pulse = cb.accent ? 1 : pulse + 1;
        const currentPulse = pulse;
        const delay = (leadIn + COUNT_IN_BEATS * secPerBeat + cb.beat * secPerBeat) * 1000;
        const id = setTimeout(() => { if (this.playing) speakCount(currentPulse); }, delay);
        this.timeouts.push(id);
      });
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
