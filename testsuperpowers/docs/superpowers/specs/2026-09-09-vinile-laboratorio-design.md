# Vinile da laboratorio — specifica di design

Data: 2026-09-09  
Stato: approvato in brainstorming (pagina a sé, approccio A)

## Scopo

Una pagina unica, senza negozio e senza festival: un vinile “da laboratorio” con cui giocare. Gira sempre, si piega verso mouse o dito, si schiaccia al tocco, e la musica elettronica sperimentale si deforma insieme al disco.

Il visitatore deve capire in pochi secondi che l’oggetto è vivo, avere voglia di piegarlo e schiacciarlo, e sentire che il suono segue le mani.

## Fuori ambito (per ora)

- Integrazione con Vinilkraft o Vision Fest
- Più dischi, scelta del brano, account, carrello
- Pulsanti play/stop/volume
- Mixer o controlli espliciti sul suono
- Scena da giradischi (piatto, braccio)

## Esperienza all’apertura

- Schermo pieno, fondo quasi nero.
- Un solo disco grande al centro: materiale trasparente, riflessi iridescenti, venature verde acido. Solchi visibili, etichetta al centro; aspetto di vetro/resina, non plastica opaca da LP da collezione.
- Il disco gira già, piano, prima di qualsiasi gesto.
- In un angolo, testo piccolo: `muovi per piegare · tocca per schiacciare`. Sparisce dopo il primo gesto (movimento o tocco). Su telefono la frase può essere più corta: `muovi · tocca`.
- Il suono non parte da solo. Al primo gesto parte il loop musicale.

## Interazione

Due gesti sullo stesso oggetto. La rotazione non si ferma mai.

### Seguire (piegare)

- Mouse o dito vicino al disco: la superficie si piega e si stira verso il puntatore, come gelatina viscosa.
- Lontano dal disco, la forma torna tonda da sola (rilascio elastico).
- Più il puntatore è vicino al bordo, più la deformazione è evidente.
- Vicino all’etichetta (centro) il materiale resta più rigido.

### Schiacciare

- Clic o tap sul disco: compressione verso il perno, poi rimbalzo e ritorno in forma in circa 1,5–2,5 secondi.
- Si può schiacciare anche mentre il disco è già piegato: piega e schiacciamento si sommano.
- Tocco fuori dal disco: nessuno schiacciamento.
- Piegare: il puntatore influenza il disco se è dentro il disco **oppure** in una corona intorno (fino a circa 1,2 volte il raggio). Oltre, la forma torna tonda.

### Puntatore assente

- Tastiera sola: il disco gira comunque. Senza gesto la musica può non partire. Accettabile, senza messaggio d’errore.

## Suono

Un solo brano elettronico sperimentale in loop (elementi elettronici, non una playlist). Parte al primo gesto.

| Stato | Suono |
| --- | --- |
| Gira da solo, nessun gesto recente | Musica “pulita”, ritmo stabile, atmosfera da laboratorio |
| Piegato verso il puntatore | Il suono si stira: più la forma è distorta, più il brano si sporca (eco, granulosità, armonici) |
| Schiacciamento | Impulso netto (click/glitch corto), poi compressione breve del brano e ritorno |

Niente mixer in interfaccia. Un solo organismo visivo + sonoro.

Se l’audio è bloccato o il file non è disponibile: il disco continua a girare e deformarsi in silenzio. Nessun errore a tutto schermo. Al massimo un accenno piccolo: `audio non disponibile`.

## Architettura (scelte di implementazione)

Pagina statica, senza build e senza backend, coerente col resto del progetto.

- `index.html` — struttura della pagina (canvas a pieno schermo, testo d’aiuto, eventuale nota audio).
- `styles.css` — fondo, tipografia minima, overlay testo, layout mobile.
- `vinile.js` — rotazione, deformazione, input, ciclo di disegno.
- `audio.js` — avvio al primo gesto, loop, mappatura deformazione → effetti.
- Asset: un loop audio nel repo (`audio/laboratorio.mp3` o `.ogg`), brano elettronico sperimentale breve, nessun streaming da servizi esterni.

Rendering: un disco 3D (mesh circolare con solchi ed etichetta) in WebGL, deformato sui vertici. Materiale trasparente con iridescenza e accenti verde acido. Input puntatore in coordinate dello schermo, proiettato sul piano del disco.

Audio: Web Audio API. Un buffer/loop; catena di effetti (filtro, distorsione/wavefolder, delay o granulosità leggera) guidata da due numeri:

- `piega` (0–1) — quanto il disco è distorto verso il puntatore
- `schiaccia` (impulso che decade) — picco al tap, poi scende in 1,5–2,5 s

Il browser richiede un gesto utente per l’audio: il primo `pointerdown` o movimento significativo sblocca il contesto e avvia il loop.

## Flusso dati

```
puntatore (x, y, down)
    → distanza dal disco, direzione dal centro
    → piega (vettore + intensità) + eventuale impulso schiaccia
    → vertici del mesh (forma) + rotazione continua
    → piega e schiaccia → parametri effetti audio
```

Nessun salvataggio, nessun account, nessuno stato tra una visita e l’altra.

## Errori e limiti

- WebGL non disponibile: messaggio breve al centro (`questo esperimento ha bisogno di un browser più recente`) e stop. Non fingere un disco fermo in 2D.
- Permessi/autoplay audio: silenzio + eventuale `audio non disponibile`, gioco visivo intatto.
- File audio mancante: stesso comportamento del punto precedente.
- Riduzione prestazioni: priorità a rotazione + piega + schiaccia; l’iridescenza può essere più semplice, non si toglie il gioco.

## Mobile

Stessi gesti (un dito). Disco centrato e grande. Niente menu hamburger. Evitare scroll della pagina (overflow nascosto). Il tocco non deve far zoomare il browser (gestione standard del pinch sul documento).

## Criteri di accettazione

1. All’apertura si vede un vinile da laboratorio (trasparente, verde acido, iridescente) che gira da solo.
2. Muovendo mouse o dito vicino, il disco si piega verso il puntatore e torna tondo quando ci si allontana.
3. Clic/tap sul disco lo schiaccia verso il centro e poi rimbalza in forma.
4. La rotazione non si ferma durante piega o schiacciamento.
5. Al primo gesto parte il loop; piega sporca il suono; tap dà un glitch/impulso.
6. L’aiuto testuale sparisce dopo il primo gesto.
7. Senza audio il gioco visivo resta usabile.
8. Su viewport stretto (~375px) il disco resta intero, centrato, giocabile.

## Verifica

Aprire la pagina in browser (non solo cattura statica): girare intorno al disco, allontanarsi, schiacciare, schiacciare mentre è piegato, toccare fuori, ricaricare, e ripetere su viewport stretto. Controllare anche il caso audio disattivato (silenzio del sistema o file rimosso).
