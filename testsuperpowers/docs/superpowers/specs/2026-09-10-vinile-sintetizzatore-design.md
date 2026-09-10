# Vinile da laboratorio — sintetizzatore (tasti + pad)

Data: 2026-09-10  
Stato: da rileggere (brainstorming, approccio B)  
Estende: `docs/superpowers/specs/2026-09-09-vinile-laboratorio-design.md`  
Sostituisce: la sezione **Suono** della spec precedente (loop di un brano registrato). Forma, gesti e look del disco restano quelli già approvati.

## Scopo

Il visitatore suona un sintetizzatore da laboratorio **e** continua a piegare/schiacciare il vinile. Il pannello **genera** il suono; il disco lo **deforma**. Un solo organismo visivo (disco) più una barra-strumento in basso, senza mixer e senza manopole.

## Fuori ambito

- Integrazione con Vinilkraft o Vision Fest
- Account, carrello, scelta brani, più dischi
- Pulsanti play/stop/volume e manopole (filtro, eco, timbro visibili)
- Sequencer a griglia, download di file, cloud, più nastri (il **nastro in pagina** è in `docs/superpowers/specs/2026-09-10-vinile-nastro-design.md`)
- Tasto “silenzio totale”
- Ripristino del file `audio/laboratorio.wav` come musica principale (può restare nel repo, inutilizzato)

## Esperienza all’apertura

- Schermo pieno, fondo quasi nero.
- Disco da laboratorio al centro, che gira già (trasparente, verde acido, iridescente).
- In basso una **barra alta**: sopra **8 pad**, sotto una **tastiera di due ottave** (tasti bianchi e neri).
- I tasti e i pad hanno luce fioca verde acido anche da fermi; al tocco (o pad acceso) la luce è più forte.
- Il disco non è coperto dalla barra. Su computer resta grande; su telefono è più piccolo ma intero, per fare spazio alla tastiera piena.
- All’inizio **silenzio**. Il suono parte al primo gesto sulla pagina (tasto, pad o disco).
- Due testi d’aiuto, che spariscono **insieme** al primo gesto (movimento, tap, tasto o pad): uno in un angolo per il disco, uno sopra la barra per il pannello.

### Testi (esatti)

| Dove | Testo |
| --- | --- |
| Aiuto disco, viewport larga | `muovi per piegare · tocca per schiacciare` |
| Aiuto disco, viewport stretta | `muovi · tocca` |
| Aiuto pannello (stesso momento, sparisce insieme) | `tieni i tasti · i pad restano accesi` |
| Audio bloccato o non avviabile | `audio non disponibile` |
| WebGL assente | `questo esperimento ha bisogno di un browser più recente` |

## Pannello

### Tasti

- Due ottave cromatiche, da un Do grave a un Do acuto (tasti bianchi e neri, forma da pianoforte).
- Luminescenza: sempre accesi in fioco; più luminosi **mentre** il tasto è premuto.
- Suonano **solo mentre tieni**. Lasciando, la nota ha una coda breve, poi tace.
- Più tasti insieme sono ammessi (soprattutto col touch).
- Nessun nome di nota sui tasti.
- Voce: timbro elettronico da laboratorio (non un piano acustico), registro medio-acuto.

### Pad

Otto pad in fila, da sinistra a destra:

1. Cassa  
2. Rullante  
3. Hi-hat  
4. Clap  
5. Tom  
6. Timbro laboratorio morbido  
7. Timbro laboratorio aspro  
8. Colpo rumoroso  

Comportamento:

- Tap: il loop **parte** e il pad resta acceso (luce forte).
- Tap di nuovo: il loop **si ferma**, luce di nuovo fioca.
- Più pad accesi insieme si sentono sovrapposti.
- Tempo del loop: **fisso**, 120 battiti al minuto, in 4/4. Con il pad cassa acceso, un colpo di cassa su ogni quarto. Piegare o schiacciare **non** cambia questa griglia; cambia timbro, sporcizia e (allo schiaccia) un impulso, non la velocità.
- Niente tasto panic: si spegne tapando ogni pad acceso.

## Disco e suono

I gesti sul disco restano quelli della spec 2026-09-09 (piega viscosa, squash da budino, corona ~1,2 raggi, rotazione che non si ferma).

| Stato | Suono |
| --- | --- |
| Gira, niente tasti né pad | Silenzio. Piegare è solo visivo. Uno schiacciamento può comunque fare un click/glitch corto. |
| Tasti e/o pad accesi, disco tondo | Suono “pulito” del sintetizzatore, ritmo dei loop stabile. |
| Piegato verso il puntatore | Tutto ciò che sta suonando si stira e si sporca (eco, asprezza, armonici). Più piega (soprattutto al bordo), più sporco. Vicino all’etichetta quasi niente. Lontano dal disco, torna pulito. |
| Schiacciamento sul disco | Glitch/click corto, poi le voci (note + pad) si schiacciano di timbro/dinamica e tornano in circa 1,5–2,5 s. I loop restano sullo stesso tempo. Piegare e schiacciare si sommano. |

Il disco non accende né spegne tasti e pad. Non ci sono altri controlli sul suono.

## Mobile

- Stessi gesti; più dita sui tasti se il browser lo permette.
- Barra in basso sempre visibile e usabile; disco più piccolo, centrato, intero, toccabile.
- Tasti più stretti, tutti visibili (niente scroll orizzontale della tastiera).
- Pagina senza scroll e senza zoom da pinch.
- Niente menu hamburger.

## Errori e limiti

- WebGL assente: messaggio al centro, stop. Niente disco finto in 2D.
- Audio bloccato o contesto non avviabile: silenzio, nota `audio non disponibile`, disco e pannello restano visivi (tasti luminescenti, pad che si “accendono” visivamente anche senza suono).
- Prestazioni: priorità a rotazione, piega, schiaccia, tasti e pad udibili. L’iridescenza può semplificarsi.

## Architettura (implementazione)

Pagina statica, senza build e senza backend, come il resto del progetto.

Unità (una responsabilità ciascuna):

| Unità | Fa | Si usa così | Dipende da |
| --- | --- | --- | --- |
| `fisica.js` | Piegare / schiacciare / corona | Numeri `piega`, `schiaccia`, direzione | Niente DOM, niente audio |
| Stato pannello (modulo dedicato) | Tasti tenuti, pad latched on/off | Insieme note attive + maschera pad | Niente audio, niente WebGL |
| Parametri suono (modulo testabile) | `piega` + `schiaccia` + stato pannello → numeri per il motore | Chiamata pura a ogni frame / evento | Solo numeri in ingresso |
| `audio.js` | Oscillatori / voci pad, unlock al gesto, click di squash | `unlock`, `setState(...)` | Parametri suono, Web Audio |
| `vinile.js` | Disco WebGL, input sul canvas | Come oggi | `fisica.js`, non ruba i tocchi della barra |
| `index.html` + `styles.css` | Canvas, barra pad+tasti, overlay testi | Markup e look | Nessuna logica pesante inline |

Flusso:

```
gesto su tasto/pad  →  stato pannello
gesto su disco      →  fisica (piega, schiaccia)
                    →  parametri suono
                    →  audio (voci + deformazione)
                    →  mesh del disco + luci tasti/pad
```

Il browser sblocca l’audio al primo gesto (pannello o disco). Nessun fetch di un brano come fonte principale.

Test: logica pura di fisica (già presente) e di parametri suono / stato pad (latch, più pad, piega che sporca senza cambiare il tempo nominale). Verifica in browser: suonare, latch dei pad, piegare, schiacciare, telefono, silenzio se audio assente.

## Criteri di accettazione

1. All’apertura: disco che gira, barra in basso con 8 pad e tastiera di due ottave luminescente in fioco, silenzio.
2. Tenere un tasto: nota; lasciare: la nota finisce (coda breve). Più tasti insieme suonano insieme.
3. Tap pad: loop resta acceso e luminoso; secondo tap: si spegne. Più pad insieme.
4. Piegare il disco sporca/stira il suono in corso; non cambia la velocità dei loop.
5. Schiacciare sul disco: glitch + schiacciamento di timbro/dinamica e ritorno, **senza** cambiare il tempo dei loop; a vuoto, almeno un click.
6. Rotazione del disco mai ferma. Disco non coperto dalla barra.
7. Aiuti (disco + pannello) spariscono al primo gesto.
8. Senza audio: nota piccola, disco e pannello ancora usabili visivamente.
9. Viewport ~375px: disco intero e toccabile, tutti i tasti visibili, pad usabili, niente scroll pagina.

## Verifica

Aprire la pagina in browser (non solo uno screenshot): suonare tasti, accendere/spegnere pad, piegare, schiacciare mentre suona, schiacciare in silenzio, allontanarsi dal disco, toccare fuori dal disco, ricaricare, ripetere su viewport stretta, ripetere con audio di sistema spento.
