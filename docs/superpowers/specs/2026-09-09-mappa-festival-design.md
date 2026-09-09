# Design Doc — Mappa Interattiva 3D e Scritte LED per Vision Fest

**Data:** 2026-09-09
**Progetto:** Vision Fest (festival-visione.html)
**Autore:** Agent
**Stato:** Approvato

---

## Obiettivo

Aggiungere una sezione "Mappa del Festival" (`#mappa-festival`) alla pagina Vision Fest che mostri una mappa top-down 2D con zone interattive. Al passaggio del mouse (hover) su desktop e al tocco su mobile, ogni zona si "anima" virtualmente in una preview 3D inline, evocando l'atmosfera del festival. Le scritte e le label utilizzano un effetto LED stile Stranger Things, con font futuristico techno e palette arancione/nero.

---

## Requisiti Utente

1. Mappa fittizia del festival con 9 zone interattive:
   - Main Stage, Techno Stage, Ambient Stage, Reactive Walls, Neural Frequencies, Generative Dreams, Toilette, Bar, Ingresso.
2. Interazione: hover su desktop, tocco su mobile.
3. Al attivazione, la zona si espande in una preview 3D inline (Three.js).
4. Scritte LED animate (flicker neon) in stile Stranger Things.
5. Palette: nero `#000`, arancione `#ff8a3d`, `#ff6f2c`, `#ffcf4d`.
6. Font futuristico techno (Google Fonts).
7. Coerenza con il design dark immersivo esistente del festival.

---

## Architettura

### Componenti

| Componente | Tecnologia | Scopo |
|---|---|---|
| `MapSection` | HTML + CSS | Sezione `#mappa-festival` con layout responsive |
| `MapZones` | HTML + CSS + JS | 9 zone `.map-zone` con eventi mouse/touch |
| `ZonePreview3D` | Three.js (inline) | Anteprima 3D inline per ogni zona attivata |
| `LEDText` | Canvas 2D + CSS | Scritte label e titoli con effetto flicker LED |
| `NeonBorder` | CSS | Bordi al neon arancione attorno alle zone attive |

### Data Flow

```
Utente hover/tocco su .map-zone
    → JS attiva la zona (aggiunge classe .active)
    → CSS applica bordo neon + glow
    → Canvas LED flicker intensificato
    → Three.js inizializza scene 3D inline nella preview container
    → Animazione camera/zoom sulla zona selezionata
Utente esce dalla zona
    → JS rimuove classe .active
    → CSS rimuove bordo neon
    → Canvas LED torna a stato normale
    → Three.js dissolve la preview (fade out)
```

---

## Design Dettagliato

### 1. Layout Mappa 2D

- Griglia CSS `grid-template-columns: repeat(3, 1fr)` su desktop, `repeat(2, 1fr)` su tablet, `1fr` su mobile.
- 9 celle `.map-zone`, ogni cella contiene:
  - Label con nome zona (effetto LED)
  - Icona/emoji stilizzata (SVG inline o carattere Unicode)
  - Preview container nascosto (`opacity: 0`, `pointer-events: none`)
- Ordine delle zone (top-down logico):
  ```
  Ingresso    | Bar          | Toilette
  Main Stage  | Techno Stage | Ambient Stage
  Reactive W. | Neural Freq. | Generative D.
  ```

### 2. Preview 3D Inline

- Ogni `.map-zone` ha un `.zone-preview` container.
- Quando `.map-zone` riceve `.active`:
  - `.zone-preview` diventa visibile (`opacity: 1`, `transition: opacity 0.4s ease`)
  - Three.js inizializza (se non già fatto) una micro-scena 3D:
    - Piano griglia nero/arancione
    - Forma geometrica semplice rappresentativa (es: cubo per stage, sfera per dreams)
    - Luce arancione pulsante
    - Camera orbitale leggera (auto-rotazione lenta)
  - Al mouse leave, fade out e dispose renderer per risparmio risorse.

- **Ottimizzazione:** Usare un solo renderer Three.js condiviso e spostarlo nel container attivo, invece di crearne 9 separati. Oppure inizializzare on-demand e dispose dopo un timeout.

### 3. Scritte LED (Stranger Things Style)

- **Font:** `Orbitron` (titoli) e `Rajdhani` (label) da Google Fonts.
- **Effetto:**
  - Testo con `text-shadow` multiplo per glow al neon arancione.
  - Animazione CSS `@keyframes flicker` che varia `opacity` e `text-shadow` rapidamente.
  - Quando zona attiva: flicker più intenso e colore più chiaro (`#ffcf4d`).
  - Quando inattiva: glow tenue e lento (`#ff6f2c`).
- **Canvas:** Per il titolo principale "MAPPA", usare Canvas 2D con disegno pixelato per simulare veri LED matrix.

### 4. Palette e Stili

```css
:root {
  --map-bg: #000000;
  --map-zone-bg: #111111;
  --neon-orange: #ff8a3d;
  --neon-bright: #ffcf4d;
  --neon-dim: #ff6f2c;
  --text-primary: #ffffff;
  --text-secondary: #aaaaaa;
}
```

- `.map-zone` background: `#111` con bordo 2px solid `#333`.
- `.map-zone.active` bordo: 2px solid `#ff8a3d`, `box-shadow: 0 0 20px #ff8a3d`.
- Transizioni fluide su tutte le proprietà (0.3s-0.4s ease).

### 5. Responsive

- **Desktop (>1024px):** Griglia 3x3, preview 3D si espande sopra/accanto alla zona.
- **Tablet (768px-1024px):** Griglia 2x? (adatta), preview 3D in overlay full-width sotto.
- **Mobile (<768px):** Griglia 1 colonna, al tocco la preview 3D apre un overlay modale a schermo intero con pulsante chiudi.

### 6. Performance

- Lazy load della sezione mappa (intersection observer).
- Three.js renderer condiviso o inizializzato on-demand.
- Limitare FPS micro-scene a 30 per risparmio batteria su mobile.
- Usare `will-change: transform, opacity` sulle zone per GPU acceleration.

---

## Error Handling

- Se Three.js CDN non disponibile: fallback a statico (immagine SVG della zona).
- Se WebGL non supportato: nascondere preview 3D, mostrare solo label LED animate.
- Touch su mobile: gestire `touchstart`/`touchend` invece di `mouseenter`/`mouseleave`.

---

## Testing

1. Verificare che tutte le 9 zone siano cliccabili/hoverabili.
2. Controllare che la preview 3D appaia e scompaia correttamente.
3. Testare responsive su 3 breakpoint (desktop, tablet, mobile).
4. Verificare performance con 9 scene Three.js (o renderer condiviso).
5. Controllare coerenza palette con il resto del festival.

---

## File Coinvolti

- `festival-visione.html` — nuova sezione `#mappa-festival` + CSS inline + JS inline
- Google Fonts CDN — aggiunta `Orbitron` e `Rajdhani`

---

## Note Implementative

- Non creare nuovi file separati: tutto rimane inline in `festival-visione.html` per coerenza con il resto del progetto.
- Mantenere il codice Vanilla JS, nessun framework.
- Riutilizzare la libreria Three.js già caricata nel festival.
