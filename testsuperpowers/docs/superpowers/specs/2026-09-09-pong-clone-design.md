# Design Document: Pong Clone

## Overview

Un clone del classico gioco Pong (Atari, 1972) da integrare nel progetto statico esistente. Il gioco e una pagina HTML dedicata con controlli da tastiera per due giocatori locali, estetica retrò arcade e effetti visivi.

## Goals

- Replicare fedelmente le meccaniche di base del Pong originale.
- Fornire un'esperienza a due giocatori sulla stessa tastiera.
- Creare un'atmosfera visiva retrò con effetti CRT (scanline, glow, vignettatura).
- Mantenere la semplicita del progetto statico esistente (HTML/CSS/JS vanilla).

## Context

Il progetto e un sito statico con due pagine HTML (`index.html`, `festival-visione.html`), nessun backend, nessun build system. Il Pong sara una terza pagina HTML (`pong.html`) con i propri file CSS (`pong.css`) e JS (`pong.js`), seguendo lo stesso pattern di Vinilkraft Records.

## Non-Goals

- Nessuna modalità single-player contro IA.
- Nessuna modalità multiplayer online.
- Nessun sistema di classifica o persistenza dei punteggi (localStorage non richiesto).
- Nessuna integrazione con le pagine esistenti (è una pagina standalone, ma con link di ritorno al sito).

## Architecture

### File Structure

```
├── index.html
├── festival-visione.html
├── pong.html              # NUOVO: Pagina del gioco
├── pong.css               # NUOVO: Stili retrò
├── pong.js                # NUOVO: Logica di gioco
├── styles.css
├── script.js
├── title.js
├── layout.js
└── docs/superpowers/specs/
    └── 2026-09-09-pong-clone-design.md
```

### Componenti

1. **pong.html**: Struttura base con `<canvas>`, overlay HTML per menu/pausa/vittoria, import font Google.
2. **pong.css**: Stili globali, stili canvas, overlay, effetti CRT (scanline, glow), animazioni.
3. **pong.js**: Tutta la logica di gioco in un unico file.

### Stati del Gioco

Il motore di gioco e gestito tramite una macchina a stati finiti (FSM):

- **MENU**: Schermata iniziale con titolo e pulsante "INIZIA PARTITA".
- **PLAYING**: Gioco attivo, loop di rendering e fisica in esecuzione.
- **PAUSED**: Gioco in pausa, overlay semitrasparente.
- **GAME_OVER**: Schermata di vittoria con punteggio finale e pulsante "RIGIOCA".

Le transizioni tra stati sono:
- MENU -> PLAYING: click su "INIZIA PARTITA" o tasto Spazio.
- PLAYING -> PAUSED: tasto `P` o `Spazio`.
- PAUSED -> PLAYING: tasto `P` o `Spazio`.
- PLAYING -> GAME_OVER: un giocatore raggiunge 10 punti.
- GAME_OVER -> MENU: click su "RIGIOCA".

### Loop di Gioco

Il loop di gioco usa `requestAnimationFrame` per il rendering fluido. Ogni iterazione:
1. Aggiorna input da tastiera.
2. Aggiorna posizioni racchette.
3. Aggiorna posizione pallina e controlla collisioni.
4. Aggiorna punteggio se necessario.
5. Controlla condizioni di vittoria.
6. Disegna il frame sul canvas.

## Design Dettagliato

### Campo di Gioco (Canvas)

- Dimensione: 800x600 pixel (dimensioni logiche), scalato via CSS per adattarsi allo schermo mantenendo aspect ratio.
- Sfondo: `#000000` (nero).
- Linea centrale tratteggiata: segmenti bianchi verticali lunghi 15px con gap di 10px.
- Bordi invisibili in alto e in basso per il rimbalzo della pallina.

### Racchette

- Dimensione: 15px larghezza, 80px altezza.
- Colore: `#FFFFFF` (bianco).
- Posizione iniziale: centrate verticalmente ai lati del campo.
- Velocita di movimento: 7 pixel/frame.

### Pallina

- Dimensione: 12x12 pixel (quadrato o cerchio).
- Colore: `#FFFFFF` (bianco).
- Velocita iniziale: 5 pixel/frame.
- Angolo di rimbalzo:
  - Se colpisce il centro della racchetta: rimbalzo orizzontale (0°).
  - Se colpisce i bordi: l'angolo aumenta proporzionalmente alla distanza dal centro (max ±45°).
- Aumento velocita: dopo ogni rimbalzo su una racchetta, la velocita aumenta del 2% (max 150% della velocita iniziale).

### Punteggio

- Posizione: in alto a sinistra e in alto a destra del canvas.
- Font: `Press Start 2P`, 48px.
- Obiettivo: primo a raggiungere **10 punti**.
- Quando un punto viene segnato: la pallina si resetta al centro, velocita torna a quella iniziale, direzione casuale.

### Effetti Visivi

1. **Scia della pallina**: ogni frame, invece di cancellare completamente il canvas, si disegna un rettangolo nero semi-trasparente (`rgba(0,0,0,0.3)`) sopra il frame precedente. Questo lascia una traccia che si dissolve lentamente.
2. **Shake**: quando un punto viene segnato, il canvas viene traslato di ±5px per 10 frame (circa 160ms) con oscillazione casuale.
3. **Scanline**: overlay CSS fisso sopra il canvas con linee orizzontali `rgba(255,255,255,0.05)` alte 2px ogni 4px.
4. **Vignettatura**: overlay CSS con gradiente radiale dal trasparente al nero sui bordi.
5. **Glow**: `text-shadow` e `box-shadow` su testo e pallina per simulare fosforescenza.

### Controlli

| Azione | Giocatore Sinistra | Giocatore Destra |
|--------|-------------------|------------------|
| Su     | `W`               | `ArrowUp`        |
| Giù    | `S`               | `ArrowDown`      |
| Pausa  | `P` o `Spazio` (entrambi i giocatori) | |

I tasti sono gestiti tramite un sistema di input che traccia lo stato dei tasti (`keydown`/`keyup`) in un oggetto `keys`, non tramite eventi singoli, per permettere movimento continuo.

### Schermate UI

#### Menu Iniziale
- Overlay HTML centrato sul canvas.
- Titolo "PONG" in grande (font pixel, glow verde).
- Pulsante "INIZIA PARTITA" (stile retrò, bordo spesso, hover effetto).
- Istruzioni controlli in piccolo sotto: "Giocatore 1: W / S  |  Giocatore 2: ↑ / ↓  |  Pausa: P".

#### Pausa
- Overlay HTML semitrasparente (`rgba(0,0,0,0.7)`).
- Scritta "PAUSA" al centro, lampeggiante (animazione CSS opacity).
- Sottotitolo: "Premi P per riprendere".

#### Vittoria
- Overlay HTML semitrasparente.
- Scritta "GIOCATORE X VINCE!" al centro.
- Punteggio finale mostrato sotto.
- Pulsante "RIGIOCA" per tornare al menu.

## Error Handling

- Se il canvas non è supportato dal browser, mostrare un messaggio fallback.
- Se i font Google non caricano, usare `Courier New` o `monospace` come fallback.
- Se la finestra viene ridimensionata, ricalcolare la scala del canvas mantenendo l'aspect ratio.

## Performance

- Il loop di gioco usa `requestAnimationFrame` per sincronizzarsi con il refresh rate del monitor.
- Il canvas e disegnato con la Canvas 2D API nativa, ottimizzata per giochi 2D.
- Gli effetti CSS (scanline, vignettatura) sono applicati via CSS overlay, non ridisegnati ogni frame.

## Testing

- Verificare che i controlli rispondano immediatamente (nessun lag).
- Verificare che le collisioni siano precise (la pallina non attraversi le racchette).
- Verificare che il punteggio aumenti correttamente.
- Verificare che la pausa funzioni in qualsiasi momento.
- Verificare che la schermata di vittoria appaia al raggiungimento di 10 punti.
- Verificare responsività su diverse dimensioni di schermo.

## Dependencies

- **Google Fonts**: `Press Start 2P` (https://fonts.google.com/specimen/Press+Start+2P)
- **Nessun altro framework o libreria**: tutto in vanilla HTML/CSS/JS.

## Risks

- **Mobile**: il gioco richiede tastiera, quindi su dispositivi mobili non e giocabile. Accettabile per lo scope attuale.
- **Performance bassa su hardware vecchio**: il gioco e leggero, ma effetti CSS pesanti (molte ombre, overlay) potrebbero rallentare su dispositivi molto vecchi. Possibile mitigazione: rendere effetti disattivabili.

## Future Considerations

- Modalità single-player con IA (bot).
- Scelta del colore della pallina/racchette.
- Suoni (rimbalzo, punto, vittoria) tramite Web Audio API.
- Persistenza punteggi massimi in localStorage.
