# Vinile da laboratorio — look MPC (scocca + tasti filtro inerti)

Data: 2026-09-11  
Stato: da rileggere  
Estende: spec sintetizzatore, nastro, tre stanze di suono  
Sostituisce, nella spec sintetizzatore e in quella dei temi, il look **vetro luminescente** della barra: la barra è uno strumento da studio tipo Akai MPC, a linee sottili. I tre pallini restano tre **stanze di suono**; sul pannello il colore della stanza si vede solo come luce, non come scocca.

## Scopo

Il visitatore deve leggere la barra in basso come un campionatore vintage da studio (MPC Akai Professional), adulto, non un giocattolo luminoso. Stessi gesti, stessi suoni. Quattro tasti extra sulla scocca sono posti per i filtri **più avanti**; oggi non cambiano il suono.

## Fuori ambito

- Filtri audio, manopole, mixer, display numerico
- Logo o scritta Akai / MPC
- Griglia pad 4×4, più ottave, più di otto pad sonori
- Cambiare disco, pallini, nastro, testi d’aiuto, stanze di suono
- Far sì che i quattro tasti extra facciano già un filtro

## Esperienza

Scocca **antracite**, metallo opaco, linee da **1 pixel** (grafite/argento spento). Niente vetro fluorescente, niente bordi spessi, niente bagliore a riposo.

Riga superiore della barra, da sinistra a destra:

1. Spia rec rossa e quadrato «nuova presa» (stesso comportamento di oggi).
2. Otto pad quadrati, gomma opaca, angoli appena smussati.
3. **Quattro tasti extra**, più stretti dei pad, stesso materiale, **senza nome visibile**. Tap: affondano un poco e tornano su. **Nessun cambio di suono**, non restano accesi, niente luce del pallino.

Sotto: tastiera di due ottave, tasti chiari e neri da studio (avorio spento / nero), fessure sottili. Non sono tinti di verde/giallo/violetto a riposo.

Luci del pallino (verde acido, giallo, violetto della stanza attiva):

- Pad **acceso** (latch): luce contenuta sul pad, non un alone che invade la scocca.
- Tasto della tastiera **tenuto**: stessa luce contenuta.
- Pad/tasti a riposo: grigio gomma/metallo, al massimo un filo di bordo.
- I quattro tasti filtro: mai la luce della stanza.

I tre pallini in alto a destra restano il cambio stanza (look + suono). Il disco al centro non cambia.

Nessun testo d’aiuto nuovo. Etichette per chi ascolta lo schermo: sui quattro extra, `filtro 1` … `filtro 4` (non visibili). Spia e nuova presa: testi già in spec nastro.

### Telefono

Stessa disposizione, tutti i controlli visibili, niente scroll orizzontale della barra. Pad e tasti filtro un po’ più stretti, tastiera intera.

## Suono e nastro

Invariati. Premere un tasto filtro non entra nel mix e non si sente sul nastro (non c’è evento sonoro).

## Errori e limiti

Audio bloccato / WebGL assente: come oggi. I tasti filtro restano visivi.

## Architettura (implementazione)

Pagina statica, senza build e senza backend.

| Unità | Fa | Si usa così | Dipende da |
| --- | --- | --- | --- |
| `styles.css` | Scocca, pad gomma, tasti studio, luci solo `.acceso` via `--tema-rgb` | Classi già in pagina + `.filtro` | Nessuna logica |
| `pannello-ui.js` | Crea i quattro bottoni a destra dei pad | `pointerdown` solo affondo visivo (classe breve o `:active`) | Non chiama audio |
| `index.html` | Eventuale contenitore `#filtri` in `#pad-row` | Markup minimo | — |

`audio.js`, `tema-suono.js`, `fisica.js`, `nastro.js`, testi in `index.html` non cambiano per i filtri. `--tema-rgb` resta; non tinge più fondo barra, bordi a riposo, scocca.

## Criteri di accettazione

1. Barra grigio antracite a linee sottili; a riposo pad e tasti non sono “neon”.
2. Luce della stanza solo su pad latch e tasto tenuto; disco e pallini invariati.
3. Quattro tasti a destra degli otto pad, senza etichetta visibile; tap senza effetto sul suono né latch.
4. Nastro, stanze, tastiera a due ottave, otto pad sonori, 120 BPM: invariati.
5. Viewport ~375px: rec, otto pad, quattro extra, tastiera visibili senza scroll pagina.
6. Nessun logo; testi d’aiuto invariati.

## Verifica

Aprire `http://127.0.0.1:8770/index.html` (non solo screenshot): scocca a riposo, accendere pad e tasti in verde/giallo/violetto, premere i quattro extra in silenzio, nastro e disco come prima, telefono.
