// Pentagrama de bateria: varias "lineas" (una por instrumento), todas sobre
// el mismo eje de tiempo, reutilizando los mismos glifos que el pentagrama
// de lectura ritmica (notas, silencios, barras, compas).
import {
  SVGNS, el, levelOf, computeBeams, drawNotehead, drawXNotehead, drawDot, drawFlag,
  drawText, drawRest, BEAT_WIDTH, PAD_LEFT, PAD_RIGHT, SIG_PAD, STEM_H, NOTEHEAD_RX,
  BEAM_GAP, BEAM_THICK, SCALE
} from './notation.js';
import { normalizeMeasure, sigBeats, pulsesForSig } from './notes.js';
import { INSTRUMENTS, INSTRUMENT_ORDER } from './drum-instruments.js';

const CENTER_Y = 78;
const HEIGHT = 150;

// Icono pequeno (nota normal o "x") usado en la leyenda de instrumentos
export function renderInstrumentGlyph(svg, shape) {
  const w = 32, h = 32, cx = 16, cy = 16;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'glyph-svg');
  const g = el('g');
  svg.appendChild(g);
  if (shape === 'x') drawXNotehead(g, cx, cy);
  else drawNotehead(g, cx, cy, true);
}

function drawTimeSig(svg, x, [num, den]) {
  drawText(svg, x, CENTER_Y - 6, String(num), 'time-sig');
  drawText(svg, x, CENTER_Y + 20, String(den), 'time-sig');
}

function measureWidth(sig, extraLeft) {
  return PAD_LEFT + extraLeft + PAD_RIGHT + sigBeats(sig) * BEAT_WIDTH;
}

function renderLane(svg, instrumentId, content, xOf, width) {
  const inst = INSTRUMENTS[instrumentId];
  const y = CENTER_Y + inst.offset;
  const events = [];

  svg.appendChild(el('line', { x1: 2, y1: y, x2: width - 2, y2: y, class: 'staff-line drum-line' }));

  const groups = normalizeMeasure(content);
  let cursorBeat = 0;

  groups.forEach(group => {
    const tokens = group.tokens;
    const xs = [];
    const offsets = [];
    let gcursor = cursorBeat;
    tokens.forEach(t => { offsets.push(gcursor); xs.push(xOf(gcursor)); gcursor += t.beats; });

    tokens.forEach((tok, idx) => {
      const x = xs[idx];
      const g = el('g', { class: `token ${tok.kind}` });
      svg.appendChild(g);

      if (tok.kind === 'rest') {
        drawRest(g, x, y, tok.base);
      } else {
        const isWhole = tok.base === 4;
        if (inst.shape === 'x') drawXNotehead(g, x, y);
        else drawNotehead(g, x, y, tok.base < 4);
        if (!isWhole) {
          const stemTopY = y - STEM_H;
          g.appendChild(el('line', { x1: x + NOTEHEAD_RX - 1, y1: y - 1, x2: x + NOTEHEAD_RX - 1, y2: stemTopY, class: 'stem' }));
          const lvl = levelOf(tok);
          if (lvl > 0 && tokens.length === 1) drawFlag(g, x + NOTEHEAD_RX - 1, stemTopY, lvl, 1);
        }
        if (tok.dotted) drawDot(g, x, y);
      }

      const hit = el('rect', {
        x: x - 14, y: y - 34, width: Math.max(28, tok.beats * BEAT_WIDTH), height: 52, class: 'hitbox'
      });
      g.insertBefore(hit, g.firstChild);

      events.push({ el: g, start: offsets[idx], dur: tok.beats, kind: tok.kind, instrument: instrumentId });
    });

    if (tokens.length > 1) {
      const beams = computeBeams(tokens, xs.map(x => x + NOTEHEAD_RX - 1));
      const stemTopY = y - STEM_H;
      beams.forEach(b => {
        const by = stemTopY + (b.level - 1) * BEAM_GAP;
        if (b.x1 != null) {
          svg.appendChild(el('rect', { x: Math.min(b.x1, b.x2), y: by - BEAM_THICK / 2, width: Math.abs(b.x2 - b.x1), height: BEAM_THICK, class: 'beam' }));
        } else {
          const stubW = 11;
          const sx = b.stubDir === 'right' ? b.x : b.x - stubW;
          svg.appendChild(el('rect', { x: sx, y: by - BEAM_THICK / 2, width: stubW, height: BEAM_THICK, class: 'beam' }));
        }
      });
    }

    cursorBeat = gcursor;
  });

  return events;
}

/**
 * Dibuja un compas de bateria (varias lineas de instrumento) dentro de un
 * <svg>. Devuelve los eventos {el, start, dur, kind, instrument} de todas
 * las lineas activas, en el mismo eje de tiempo.
 */
export function renderDrumMeasure(svg, measure, { number, showSig } = {}) {
  const { sig, lanes } = measure;
  const active = INSTRUMENT_ORDER.filter(id => lanes[id]);
  const extraLeft = showSig ? SIG_PAD : 0;
  const width = measureWidth(sig, extraLeft);
  svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
  svg.setAttribute('class', 'measure-svg drum-svg');
  svg.style.width = `${width * SCALE}px`;
  svg.style.height = `${HEIGHT * SCALE}px`;

  const offsets = active.map(id => INSTRUMENTS[id].offset);
  const top = CENTER_Y + Math.min(...offsets) - STEM_H - 14;
  const bottom = CENTER_Y + Math.max(...offsets) + 14;
  svg.appendChild(el('line', { x1: 2, y1: top, x2: 2, y2: bottom, class: 'barline' }));
  svg.appendChild(el('line', { x1: width - 2, y1: top, x2: width - 2, y2: bottom, class: 'barline' }));

  if (number != null) {
    svg.appendChild(el('text', { x: 4, y: top + 10, class: 'measure-number' })).textContent = number;
  }
  if (showSig) drawTimeSig(svg, PAD_LEFT + extraLeft - BEAT_WIDTH * 0.42, sig);

  const xOf = beat => PAD_LEFT + extraLeft + beat * BEAT_WIDTH;

  let events = [];
  active.forEach(id => {
    events = events.concat(renderLane(svg, id, lanes[id], xOf, width));
  });

  return events;
}

/**
 * Renderiza un ejercicio de bateria completo. Misma interfaz que
 * renderExercise (js/notation.js) para poder compartir el reproductor.
 */
export function renderDrumExercise(container, measures) {
  container.innerHTML = '';
  const allEvents = [];
  const clickBeats = [];
  let absBeat = 0;
  let prevSigKey = null;

  measures.forEach((measure, i) => {
    const { sig } = measure;
    const sigKey = sig.join('/');
    const showSig = sigKey !== prevSigKey;
    prevSigKey = sigKey;

    const wrapper = document.createElement('div');
    wrapper.className = 'measure-row';
    const svg = document.createElementNS(SVGNS, 'svg');
    wrapper.appendChild(svg);
    container.appendChild(wrapper);

    const events = renderDrumMeasure(svg, measure, { number: i + 1, showSig });
    events.forEach(ev => {
      allEvents.push({ el: ev.el, absStart: absBeat + ev.start, dur: ev.dur, kind: ev.kind, instrument: ev.instrument });
    });

    pulsesForSig(sig).forEach((p, idx) => {
      clickBeats.push({ beat: absBeat + p, accent: idx === 0 });
    });

    absBeat += sigBeats(sig);
  });

  return { events: allEvents, totalBeats: absBeat, clickBeats };
}
