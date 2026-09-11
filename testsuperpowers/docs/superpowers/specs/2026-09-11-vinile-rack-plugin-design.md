# Vinile da laboratorio — rack plugin sotto la MPC

Data: 2026-09-11  
Stato: da rileggere  
Estende: spec look MPC, spec sintetizzatore, spec nastro, spec tre stanze di suono  
Sostituisce, nella spec look MPC, i quattro tasti extra **anonimi e inerti**: diventano selettori `REV` `ECO` `EQ` `CMP` di un cassetto-plugin. Il suono di tasti, pad, disco e nastro **non** cambia in questo giro.

## Scopo

Il visitatore, su uno schermo da computer, deve poter aprire sotto la tastiera un rack da studio (manopole, fader, grafico) come un plugin vero. Quattro tasti a destra dei pad dicono quale plugin è aperto. Per ora è scenografia che si usa: i controlli si muovono e restano; il mix resta quello delle tre stanze. Il collegamento manopole → suono è un lavoro successivo.

## Fuori ambito

- Far sì che manopole o fader alterino il segnale (riverbero, eco, EQ, compressore reali)
- Altri plugin oltre i quattro
- Aprire il cassetto sul telefono
- Logo o nomi di marche (Akai, MPC, LuxeVERB, ecc.)
- Cambiare disco, pallini, nastro, testi d’aiuto, otto pad sonori, due ottave, 120 BPM
- Finestra fluttuante sopra il vinile; copia piena di un plugin commerciale (decine di manopole)

## Esperienza

### All’inizio

Come oggi dopo il look MPC: disco, tre pallini, nastro, otto pad, quattro tasti plugin, tastiera. **Nessun rack visibile.** Il vinile occupa lo spazio attuale.

I quattro tasti a destra dei pad hanno **sempre** una sigla piccola, anche da spenti, da sinistra a destra:

| Tasto | Sigla visibile | Plugin |
| --- | --- | --- |
| 1 | `REV` | Riverbero |
| 2 | `ECO` | Eco |
| 3 | `EQ` | Equalizzatore |
| 4 | `CMP` | Compressore |

Da spenti: gomma antracite, sigla leggibile ma smorzata. Etichette per chi ascolta lo schermo (non visibili come testo extra): `riverbero`, `eco`, `equalizzatore`, `compressore`.

### Aprire, cambiare, chiudere (solo computer)

Tocco `REV`: quel tasto si accende con la **luce della stanza** (come un pad latch, contenuta sul tasto). Gli altri tre restano spenti. Sotto la tastiera si apre il cassetto del riverbero. Il vinile si rimpicciolisce un po’, resta visibile e si piega/schiaccia come oggi.

Tocco `EQ` con il riverbero aperto: `REV` si spegne, si vede il rack equalizzatore. Le manopole del riverbero restano dove erano, nascoste.

Tocco di nuovo il tasto già acceso: il cassetto si chiude, tutti e quattro i tasti tornano spenti, il vinile riprende spazio.

Mai due plugin aperti insieme.

Nastro, piega e schiaccia restano usabili col cassetto aperto.

### Look del rack

Due strati, come un plugin da computer, **non** il blu della foto di riferimento:

1. Riga comandi: gruppi con etichette corte in italiano, fader verticali e manopole.
2. Riga grafico: disegno che si muove con ciò che si sente; a destra il nome per esteso (`RIVERBERO`, `ECO`, `EQUALIZZATORE`, `COMPRESSORE`).

Colori del pannello rack: antracite della MPC + tinta della stanza attiva (`--tema-rgb`: verde acido / giallo / violetto). Cambio pallino a cassetto aperto: il rack cambia colore subito; i valori dei controlli no.

Linee sottili (1 px). Niente vetro giocattolo, niente neon a riposo sui controlli.

### Controlli (scenografia)

Si trascinano (manopola: giro; fader: su/giù). Restano dove li lasci, anche chiudendo e riaprendo quel plugin, su questo computer. Tutti i valori sono da 0 a 1; se manca un salvataggio, **0,5**.

**REV — RIVERBERO**

| Gruppo | Controllo | Tipo |
| --- | --- | --- |
| Ingresso | livello | fader |
| Riverbero | coda | manopola |
| Riverbero | stanza | manopola |
| Mix | mix | fader |

Grafico: onde morbide.

**ECO**

| Gruppo | Controllo | Tipo |
| --- | --- | --- |
| Tempo | tempo | manopola |
| Ripetizioni | ripetizioni | manopola |
| Mix | mix | fader |

Grafico: echi a scalini.

**EQ — EQUALIZZATORE**

| Gruppo | Controllo | Tipo |
| --- | --- | --- |
| Bande | gravi | fader |
| Bande | medi | fader |
| Bande | acuti | fader |
| Timbro | presenza | manopola |
| Timbro | brillantezza | manopola |

Grafico: curva.

**CMP — COMPRESSORE**

| Gruppo | Controllo | Tipo |
| --- | --- | --- |
| Dinamica | soglia | manopola |
| Dinamica | rapporto | manopola |
| Dinamica | attacco | manopola |
| Mix | mix | fader |

Grafico: livello che “schiaccia” contro un tetto.

Niente altri parametri visibili. Girare un controllo **non** cambia il suono e **non** si sente sul nastro.

### Grafico

Ascolta in sola lettura il mix già esistente (tasti, pad, disco). A volume zero o audio bloccato è quasi fermo. Non finge movimento in silenzio. Quattro disegni diversi, stesso ascolto.

### Persistenza

- Pallino stanza: come oggi (`vinile_tema`).
- Valori manopole/fader: questo computer, chiave `vinile_rack`. JSON per i quattro plugin; se il dato è illeggibile, si torna a 0,5.
- Quale plugin è aperto: **non** si salva. Ricaricare la pagina = rack chiuso, tasti spenti, manopole ripristinate dal salvataggio.

### Telefono

I quattro tasti con le sigle restano visibili sulla riga pad. Il cassetto **non** si apre. Un tap su `REV`/`ECO`/`EQ`/`CMP` affonda un attimo e torna; **nessun** latch, nessuna luce di stanza su quei tasti. Soglia: larghezza sotto **700 px**. Se la finestra si restringe sotto quella soglia con un plugin aperto, il cassetto si chiude e i quattro tasti tornano spenti (le manopole restano salvate).

## Suono e nastro

Invariati. Nessun effetto inserito nella catena. L’ascolto per il grafico è un prelievo: non attenua e non colora. Il nastro incide quello che si sente, come oggi, ignaro delle manopole.

## Errori e limiti

- Audio bloccato: `audio non disponibile` come oggi; rack (se aperto su computer) visibile, grafico quasi fermo, manopole usabili.
- WebGL assente: invariato; il cassetto non dipende dal disco 3D.
- Salvataggio manopole fallito (archivio pieno): i valori restano per la sessione, al ricarico tornano a 0,5.

## Architettura (implementazione)

Pagina statica, senza build e senza backend. Preview `http://127.0.0.1:8770/index.html`.

Il cassetto è sotto `#tastiera`, dentro `#pannello` (il vinile sopra cede spazio in CSS quando `#rack` è visibile).

| Unità | Fa | Si usa così | Dipende da |
| --- | --- | --- | --- |
| `rack.js` | Id plugin, elenco controlli, toggle selezione, clamp 0–1, load/save `vinile_rack` | Funzioni pure + `localStorage` | Nessun DOM, nessun audio |
| `rack-ui.js` | Cassetto a due strati, manopole/fader, canvas grafico | `mountRack`; `setOpen(id\|null)`; `drawFrame(samples)` | `rack.js` |
| `pannello-ui.js` | Sigle sui quattro tasti; su computer: latch esclusivo e `onPluginToggle(id)`; sotto 700 px: solo affondo | Come oggi + callback | `FILTER_COUNT` già 4 |
| `audio.js` | Prelievo analizzatore sul mix, senza inserire effetti | `getMeterFrame()` → array di ampiezze | Web Audio già sbloccato |
| `styles.css` | Cassetto, tinta `--tema-rgb`, nascondere `#rack` sotto 700 px | Classi del cassetto | — |
| `vinile.js` | Collega toggle, non apre sotto 700 px, anima il grafico se aperto | Come oggi | pannello, rack, audio |

Flusso:

```
tap tasto plugin (computer)
  → toggle selezione in rack.js (uno o nessuno)
  → luce .acceso sul tasto / cassetto visibile
  → manopola → setParam → vinile_rack
  → getMeterFrame → disegno per plugin aperto

tap tasto plugin (larghezza < 700 px)
  → nessun toggle, cassetto resta chiuso
```

`tema-suono.js`, `audio-params.js`, `fisica.js`, `nastro.js` e i testi in `index.html` non cambiano per questa feature. `audio.js` aggiunge solo il prelievo per il grafico.

## Criteri di accettazione

1. Computer, all’avvio: nessun cassetto; sigle `REV` `ECO` `EQ` `CMP` visibili e spente.
2. Un tasto apre il suo rack e si accende con la luce della stanza; un secondo tasto sostituisce il plugin; lo stesso tasto chiude tutto.
3. Manopole/fader si muovono, restano chiudendo/riaprendo, sopravvivono al ricarico; il plugin aperto no.
4. Cambio pallino a rack aperto: colore nuovo, valori invariati.
5. Suono e nastro identici a prima di questa feature; girare i controlli non si sente.
6. Grafico si muove suonando; in silenzio o senza audio è quasi fermo.
7. Sotto 700 px: sigle visibili, cassetto assente, tap senza latch.
8. Nessun logo di marca; testi d’aiuto invariati; disco e pallini al loro posto.

## Verifica

Aprire `http://127.0.0.1:8770/index.html` su computer (non solo screenshot): aprire/chiudere i quattro plugin, trascinare controlli, cambiare stanza a rack aperto, suonare e guardare il grafico, ricaricare (rack chiuso, manopole ripristinate), registrare un nastro mentre si gira una manopola (il nastro non deve “sentire” il plugin). Larghezza stretta: cassetto che non parte. Audio di sistema spento: UI e grafico quasi fermo.
