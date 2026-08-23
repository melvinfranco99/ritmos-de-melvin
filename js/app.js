import { LEVELS } from './levels.js';
import { NOTE, REST } from './notes.js';
import { renderExercise, renderGlyph } from './notation.js';
import { Player } from './audio.js';

const app = document.getElementById('app');
const player = new Player();

const LEGEND = [
  NOTE.redonda(), NOTE.blanca(), NOTE.blanca(true), NOTE.negra(), NOTE.negra(true),
  NOTE.corchea(), NOTE.corchea(true), NOTE.semicorchea(), NOTE.semicorchea(true),
  NOTE.fusa(), NOTE.fusa(true), REST.negra(), REST.corchea()
];

function go(hash) {
  window.location.hash = hash;
}

function sigLabel(sig) {
  return sig ? `${sig[0]}/${sig[1]}` : 'Mixto';
}

function findLevel(id) {
  return LEVELS.find(l => l.id === id);
}

function renderHome() {
  app.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'level-grid';

  LEVELS.forEach(lvl => {
    const card = document.createElement('button');
    card.className = 'level-card';
    card.style.setProperty('--lvl-color', lvl.color);
    card.innerHTML = `
      <span class="level-num">${lvl.id}</span>
      <span class="level-label">Nivel ${lvl.id}</span>
      <span class="level-resumen">${lvl.resumen}</span>
    `;
    card.addEventListener('click', () => go(`#/nivel/${lvl.id}`));
    grid.appendChild(card);
  });

  app.appendChild(grid);
}

function buildLegend(container) {
  container.innerHTML = '';
  LEGEND.forEach(tok => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    item.appendChild(svg);
    renderGlyph(svg, tok);
    const label = document.createElement('span');
    label.textContent = tok.label;
    item.appendChild(label);
    container.appendChild(item);
  });
}

function renderExerciseListView(levelId) {
  player.stop();
  const lvl = findLevel(levelId);
  if (!lvl) { go('#/'); return; }

  app.innerHTML = '';
  const view = document.createElement('div');
  view.className = 'exercise-list-view';
  view.style.setProperty('--lvl-color', lvl.color);
  view.innerHTML = `
    <div class="level-toolbar">
      <button class="btn btn-back" id="btn-back">&larr; Niveles</button>
      <h2>Nivel ${lvl.id} <span class="level-toolbar-resumen">${lvl.resumen}</span></h2>
    </div>
    <div class="exercise-grid" id="exercise-grid"></div>
  `;
  app.appendChild(view);

  document.getElementById('btn-back').addEventListener('click', () => go('#/'));

  const grid = document.getElementById('exercise-grid');
  lvl.exercises.forEach((ex, i) => {
    const card = document.createElement('button');
    card.className = 'exercise-card';
    card.innerHTML = `
      <span class="exercise-num">${i + 1}</span>
      <span class="exercise-title">${ex.title}</span>
      <span class="exercise-meta">${sigLabel(ex.sig)} · ${ex.measures.length} compases</span>
    `;
    card.addEventListener('click', () => go(`#/nivel/${lvl.id}/ejercicio/${i + 1}`));
    grid.appendChild(card);
  });
}

function renderExerciseView(levelId, exerciseNum) {
  player.stop();
  const lvl = findLevel(levelId);
  const exIndex = exerciseNum - 1;
  const exercise = lvl && lvl.exercises[exIndex];
  if (!lvl || !exercise) { go(`#/nivel/${levelId}`); return; }

  app.innerHTML = '';
  const view = document.createElement('div');
  view.className = 'level-view';
  view.style.setProperty('--lvl-color', lvl.color);
  view.innerHTML = `
    <div class="level-toolbar">
      <button class="btn btn-back" id="btn-back">&larr; Ejercicios</button>
      <h2>Nivel ${lvl.id} <span class="level-toolbar-resumen">${exercise.title} · ${sigLabel(exercise.sig)}</span></h2>
    </div>

    <div class="controls">
      <button class="btn btn-play" id="btn-play">▶ Reproducir</button>

      <label class="control tempo-control">
        <span>Tempo: <b id="bpm-label">80</b> BPM</span>
        <input type="range" id="bpm-range" min="40" max="160" value="80" step="1" />
      </label>

      <label class="control switch-control">
        <input type="checkbox" id="metronome-toggle" />
        <span>Metronomo</span>
      </label>

      <div class="count-in" id="count-in" aria-live="polite"></div>
    </div>

    <div class="staff-container" id="staff"><div class="staff-grid" id="staff-grid"></div></div>

    <div class="legend" id="legend"></div>
  `;
  app.appendChild(view);

  document.getElementById('btn-back').addEventListener('click', () => go(`#/nivel/${lvl.id}`));

  const staffGrid = document.getElementById('staff-grid');
  const { events, totalBeats, clickBeats } = renderExercise(staffGrid, exercise.measures);

  buildLegend(document.getElementById('legend'));

  const bpmRange = document.getElementById('bpm-range');
  const bpmLabel = document.getElementById('bpm-label');
  bpmRange.addEventListener('input', () => { bpmLabel.textContent = bpmRange.value; });

  const metronomeToggle = document.getElementById('metronome-toggle');
  const playBtn = document.getElementById('btn-play');
  const countInEl = document.getElementById('count-in');

  let activeEls = [];
  function setActive(evs) {
    activeEls.forEach(el => el.classList.remove('active'));
    activeEls = (evs || []).map(ev => ev.el);
    activeEls.forEach(el => el.classList.add('active'));
  }

  function resetPlayUI() {
    playBtn.textContent = '▶ Reproducir';
    playBtn.classList.remove('playing');
    countInEl.textContent = '';
  }

  playBtn.addEventListener('click', () => {
    if (player.isPlaying()) {
      player.stop();
      resetPlayUI();
      return;
    }
    playBtn.textContent = '⏳ Preparando…';
    playBtn.classList.add('playing');
    player.play({
      events,
      totalBeats,
      clickBeats,
      bpm: Number(bpmRange.value),
      metronome: metronomeToggle.checked,
      onNoteChange: setActive,
      onCountIn: beat => {
        if (beat === -1) {
          countInEl.textContent = '';
          playBtn.textContent = '■ Detener';
        } else {
          countInEl.textContent = `🥁 ${beat + 1}`;
        }
      },
      onEnd: resetPlayUI
    });
  });
}

function route() {
  const hash = window.location.hash;
  const exerciseMatch = hash.match(/^#\/nivel\/(\d+)\/ejercicio\/(\d+)/);
  const levelMatch = hash.match(/^#\/nivel\/(\d+)/);
  if (exerciseMatch) {
    renderExerciseView(Number(exerciseMatch[1]), Number(exerciseMatch[2]));
  } else if (levelMatch) {
    renderExerciseListView(Number(levelMatch[1]));
  } else {
    player.stop();
    renderHome();
  }
}

window.addEventListener('hashchange', route);
route();
