import { normalizeMeasure } from './notes.js';

const SVGNS = 'http://www.w3.org/2000/svg';

// Geometria del pentagrama de una sola linea
const BEAT_WIDTH = 110;
const PAD_LEFT = 34;
const PAD_RIGHT = 26;
const LINE_Y = 54;
const STEM_H = 34;
const NOTEHEAD_RX = 6.5;
const NOTEHEAD_RY = 5;
const BEAM_GAP = 6;
const BEAM_THICK = 3.4;

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVGNS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

function levelOf(token) {
  if (token.kind !== 'note') return 0;
  if (token.base === 0.5) return 1;
  if (token.base === 0.25) return 2;
  if (token.base === 0.125) return 3;
  return 0; // negra o mayor: no se agrupa con barra
}

// Calcula los segmentos de barra (completos o "stub") para un grupo de tokens ya posicionados
function computeBeams(tokens, xs) {
  const levels = tokens.map(levelOf);
  const maxLevel = Math.max(0, ...levels);
  const beams = [];
  for (let L = 1; L <= maxLevel; L++) {
    let i = 0;
    while (i < tokens.length) {
      if (levels[i] >= L) {
        let j = i;
        while (j + 1 < tokens.length && levels[j + 1] >= L) j++;
        if (j > i) {
          beams.push({ level: L, x1: xs[i], x2: xs[j] });
        } else {
          const leftOk = i > 0 && levels[i - 1] >= L - 1 && levels[i - 1] > 0;
          const rightOk = i < tokens.length - 1 && levels[i + 1] >= L - 1 && levels[i + 1] > 0;
          let dir = 'right';
          if (i === tokens.length - 1) dir = 'left';
          else if (i === 0) dir = 'right';
          else dir = leftOk ? 'left' : 'right';
          beams.push({ level: L, x: xs[i], stubDir: dir });
        }
        i = j + 1;
      } else i++;
    }
  }
  return beams;
}

function drawNotehead(g, x, y, filled) {
  const head = el('ellipse', {
    cx: x, cy: y, rx: NOTEHEAD_RX, ry: NOTEHEAD_RY,
    class: filled ? 'notehead-filled' : 'notehead-open',
    transform: `rotate(-18 ${x} ${y})`
  });
  g.appendChild(head);
}

function drawDot(g, x, y) {
  g.appendChild(el('circle', { cx: x + 12, cy: y - 5, r: 2.4, class: 'dot' }));
}

function drawFlag(g, x, stemTopY, count, dir = 1) {
  for (let k = 0; k < count; k++) {
    const y0 = stemTopY + k * 7;
    const path = `M ${x} ${y0} C ${x + 14 * dir} ${y0 + 4}, ${x + 16 * dir} ${y0 + 14}, ${x + 4 * dir} ${y0 + 20}`;
    g.appendChild(el('path', { d: path, class: 'flag' }));
  }
}

// Silencios dibujados como glifos simples y reconocibles
function drawRest(g, x, base) {
  const y = LINE_Y;
  if (base === 4) {
    g.appendChild(el('rect', { x: x - 8, y: y - 12, width: 16, height: 6, class: 'rest' }));
  } else if (base === 2) {
    g.appendChild(el('rect', { x: x - 8, y: y - 4, width: 16, height: 6, class: 'rest' }));
  } else if (base === 1) {
    const d = `M ${x - 2} ${y - 14}
               C ${x + 8} ${y - 10}, ${x - 6} ${y - 5}, ${x + 4} ${y - 2}
               C ${x - 6} ${y}, ${x - 2} ${y + 6}, ${x + 6} ${y + 14}
               C ${x - 3} ${y + 7}, ${x - 8} ${y + 4}, ${x - 1} ${y - 1}
               C ${x - 8} ${y - 4}, ${x - 8} ${y - 10}, ${x - 2} ${y - 14} Z`;
    g.appendChild(el('path', { d, class: 'rest' }));
  } else {
    // corchea / semicorchea / fusa: linea con 1, 2 o 3 ganchos
    const hooks = base === 0.5 ? 1 : base === 0.25 ? 2 : 3;
    g.appendChild(el('line', { x1: x, y1: y - 14, x2: x + 3, y2: y + 12, class: 'rest-stem' }));
    for (let k = 0; k < hooks; k++) {
      const cy = y - 12 + k * 7;
      g.appendChild(el('circle', { cx: x + 2 + k * 1.2, cy: cy + 3, r: 2.6, class: 'rest-flag' }));
    }
  }
}

function measureWidth(measureGroups) {
  const beats = measureGroups.reduce((s, g) => s + g.tokens.reduce((a, t) => a + t.beats, 0), 0);
  return PAD_LEFT + PAD_RIGHT + beats * BEAT_WIDTH;
}

/**
 * Dibuja un compas dentro de un <svg> ya creado. Devuelve la lista de elementos
 * {el, start, dur} en orden, para sincronizar el resaltado durante la reproduccion.
 */
export function renderMeasure(svg, measure, { number } = {}) {
  const groups = normalizeMeasure(measure);
  const width = measureWidth(groups);
  const height = 92;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'measure-svg');

  // Linea del pentagrama
  svg.appendChild(el('line', { x1: 2, y1: LINE_Y, x2: width - 2, y2: LINE_Y, class: 'staff-line' }));
  // Barras de compas
  svg.appendChild(el('line', { x1: 2, y1: LINE_Y - 26, x2: 2, y2: LINE_Y + 26, class: 'barline' }));
  svg.appendChild(el('line', { x1: width - 2, y1: LINE_Y - 26, x2: width - 2, y2: LINE_Y + 26, class: 'barline' }));

  if (number != null) {
    svg.appendChild(el('text', { x: 4, y: 16, class: 'measure-number' })).textContent = number;
  }

  const events = [];
  let cursorBeat = 0;
  const xOf = beat => PAD_LEFT + beat * BEAT_WIDTH;

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
        drawRest(g, x, tok.base);
      } else {
        const filled = tok.base < 4 && tok.base !== 2;
        const isWhole = tok.base === 4;
        drawNotehead(g, x, LINE_Y, filled);
        if (!isWhole) {
          const stemTopY = LINE_Y - STEM_H;
          g.appendChild(el('line', { x1: x + NOTEHEAD_RX - 1, y1: LINE_Y - 1, x2: x + NOTEHEAD_RX - 1, y2: stemTopY, class: 'stem' }));
          const lvl = levelOf(tok);
          if (lvl > 0 && tokens.length === 1) {
            drawFlag(g, x + NOTEHEAD_RX - 1, stemTopY, lvl, 1);
          }
        }
        if (tok.dotted) drawDot(g, x, LINE_Y);
      }

      // area clicable/resaltable un poco mas ancha que la nota
      const hit = el('rect', {
        x: x - 14, y: LINE_Y - 34, width: Math.max(28, tok.beats * BEAT_WIDTH), height: 52,
        class: 'hitbox'
      });
      g.insertBefore(hit, g.firstChild);

      events.push({ el: g, start: offsets[idx], dur: tok.beats, kind: tok.kind });
    });

    // barras (beams) para el grupo
    if (tokens.length > 1) {
      const beams = computeBeams(tokens, xs.map(x => x + NOTEHEAD_RX - 1));
      const stemTopY = LINE_Y - STEM_H;
      beams.forEach(b => {
        const y = stemTopY + (b.level - 1) * BEAM_GAP;
        if (b.x1 != null) {
          svg.appendChild(el('rect', { x: Math.min(b.x1, b.x2), y: y - BEAM_THICK / 2, width: Math.abs(b.x2 - b.x1), height: BEAM_THICK, class: 'beam' }));
        } else {
          const stubW = 11;
          const sx = b.stubDir === 'right' ? b.x : b.x - stubW;
          svg.appendChild(el('rect', { x: sx, y: y - BEAM_THICK / 2, width: stubW, height: BEAM_THICK, class: 'beam' }));
        }
      });
    }

    cursorBeat = gcursor;
  });

  return events;
}

/**
 * Renderiza un nivel completo (varios compases apilados). Devuelve la lista
 * global de eventos con su tiempo absoluto en beats, para la reproduccion.
 */
// Dibuja un unico glifo (nota o silencio) centrado, usado para la leyenda de figuras.
export function renderGlyph(svg, token) {
  const width = 46, height = 70;
  const cx = 20, cy = 46;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'glyph-svg');
  svg.appendChild(el('line', { x1: 2, y1: cy, x2: width - 2, y2: cy, class: 'staff-line' }));

  const g = el('g', { class: `token ${token.kind}` });
  svg.appendChild(g);

  if (token.kind === 'rest') {
    drawRest(g, cx + 6, token.base);
  } else {
    const filled = token.base < 4 && token.base !== 2;
    const isWhole = token.base === 4;
    drawNotehead(g, cx, cy, filled);
    if (!isWhole) {
      const stemTopY = cy - STEM_H;
      g.appendChild(el('line', { x1: cx + NOTEHEAD_RX - 1, y1: cy - 1, x2: cx + NOTEHEAD_RX - 1, y2: stemTopY, class: 'stem' }));
      const lvl = levelOf(token);
      if (lvl > 0) drawFlag(g, cx + NOTEHEAD_RX - 1, stemTopY, lvl, 1);
    }
    if (token.dotted) drawDot(g, cx, cy);
  }
}

export function renderLevel(container, measures) {
  container.innerHTML = '';
  const allEvents = [];
  let absBeat = 0;

  measures.forEach((measure, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'measure-row';
    const svg = document.createElementNS(SVGNS, 'svg');
    wrapper.appendChild(svg);
    container.appendChild(wrapper);

    const events = renderMeasure(svg, measure, { number: i + 1 });
    events.forEach(ev => {
      allEvents.push({ el: ev.el, absStart: absBeat + ev.start, dur: ev.dur, kind: ev.kind });
    });
    const beats = normalizeMeasure(measure).reduce((s, g) => s + g.tokens.reduce((a, t) => a + t.beats, 0), 0);
    absBeat += beats;
  });

  return { events: allEvents, totalBeats: absBeat };
}
