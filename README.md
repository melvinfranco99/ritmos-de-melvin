# Ritmos de Melvin 🥁

Web para practicar lectura ritmica en casa, sin puntuaciones ni cuentas.

- 10 niveles de dificultad progresiva (redondas y blancas hasta fusas con puntillo).
- Cada compas se puede escuchar con un sonido de caja (snare) sintetizado.
- Tempo ajustable (40–160 BPM) y metronomo opcional.
- Notacion ritmica dibujada en SVG, sin librerias externas.

## Uso local

Al ser una web estatica, basta con servir la carpeta con cualquier servidor HTTP, por ejemplo:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000`.

## Estructura

- `index.html`, `style.css` — interfaz.
- `js/notes.js` — modelo de figuras ritmicas.
- `js/levels.js` — definicion de los 10 niveles.
- `js/notation.js` — renderizador de notacion en SVG.
- `js/audio.js` — sintetizador de caja, metronomo y reproduccion.
- `js/app.js` — logica de la interfaz y navegacion entre niveles.
