# Vinile da laboratorio — nastro (registra / riascolta)

Data: 2026-09-10  
Stato: da rileggere  
Estende: `docs/superpowers/specs/2026-09-10-vinile-sintetizzatore-design.md`  
Sostituisce, in quella spec, la riga di **fuori ambito** «Sequencer a griglia, registrazione, salvataggio»: il **nastro in pagina** entra in ambito; restano fuori sequencer a griglia, download di file, cloud e più nastri insieme.

Look di tasti/pad (vetro, luce fioca/forte) e comportamento di tasti, pad e disco restano quelli già approvati. Questo documento aggiunge solo i due bottoni del nastro.

## Scopo

Il visitatore registra **quello che sente** (tasti, pad, piega e schiaccia del disco), poi lo riascolta sulla stessa pagina, una volta. Un bottone-spia rosso per registra/riascolta; un bottone piccolo per buttare il nastro e restare in silenzio.

## Fuori ambito

- Scaricare un file, condividere, account, cloud
- Più nastri, overdub sul nastro già inciso, metronomo extra
- Sequencer a griglia, undo, nomi delle prese
- Luce di due colori (rec vs play): la spia è **rossa acceso/spento**; acceso = solo registrazione
- Far “risporcare” dal disco un nastro già inciso
- Cambiare il look del disco durante rec/play

## Esperienza

Sulla riga dei pad, **a sinistra**, prima della cassa:

1. **Spia tonda rossa** (bottone grande): registra / ferma / riascolta.
2. **Quadrato piccolo** in vetro verde come i pad: nuova presa.

Gli otto pad restano tutti visibili, un po’ più stretti. Su telefono: stessi due bottoni a sinistra, pad tutti visibili, niente scroll.

Nessun nome scritto grande sui bottoni. Testi per chi ascolta lo schermo (etichette): `registra` sulla spia, `nuova presa` sul quadrato. In registrazione l’etichetta della spia diventa `registrazione`.

### Spia rossa

| Situazione | Luce | Tap |
| --- | --- | --- |
| Niente nastro | Fioca | Parte la registrazione; luce **forte** |
| Sta registrando | Forte | Ferma e parte subito il riascolto **una volta**; poi silenzio, luce fioca |
| C’è un nastro, silenzio | Fioca | Riascolta **una volta**; luce resta fioca |
| Sta riascoltando | Fioca | Niente di extra: il nastro finisce da solo (un ascolto) |

Se la registrazione dura **60 secondi**, si ferma da sola e riascolta come se il visitatore avesse toccato la spia.

La spia **non** si accende forte durante il riascolto: si capisce dall’orecchio, non da un secondo colore.

### Nuova presa

Tap: ferma rec o ascolto se in corso, **cancella** il nastro, **silenzio**, spia fioca. **Non** avvia una registrazione nuova. Si registra di nuovo solo con un tap sulla spia.

Se non c’è nastro e non si sta registrando: nessun suono, nessun cambio visibile (già vuoto).

### Cosa finisce sul nastro

Tutto ciò che si sente in quel momento: tasti tenuti, pad in loop, piega, schiaccia, click di squash. Il nastro è lo **stampo** di quell’ascolto.

Al riascolto:

- Il disco **non** modifica il nastro (è già impresso).
- Tasti, pad e disco restano usabili **dal vivo**; quel suono live **non** si aggiunge al nastro.

Per **sostituire** una presa serve «nuova presa» (nastro vuoto) e poi un tap sulla spia. Un tap sulla spia con nastro già presente riascolta, non registra sopra.

### Silenzio e vuoto

- Tap sulla spia senza aver suonato: si registra comunque; al riascolto si sente quel silenzio (o quasi).
- All’apertura: nessun nastro, spia fioca, silenzio come già in spec sintetizzatore.

## Testi (esatti)

Nessun nuovo testo d’aiuto a schermo. Restano quelli della spec sintetizzatore.

| Dove | Testo |
| --- | --- |
| Etichetta spia, non in rec | `registra` |
| Etichetta spia, in rec | `registrazione` |
| Etichetta quadrato | `nuova presa` |
| Audio non avviabile (già esistente) | `audio non disponibile` |

## Errori e limiti

- Audio assente: spia e quadrato restano visibili; la spia può diventare rossa forte al tap, ma **non** si crea nastro udibile; resta `audio non disponibile`. Disco, tasti e pad restano visivi.
- WebGL assente: invariato (pagina ferma, niente disco). I bottoni nastro non servono se la pagina è già ferma.
- Un solo nastro alla volta; niente salvataggio oltre la sessione: ricaricare la pagina **perde** la presa (accettato).

## Architettura (implementazione)

Pagina statica, senza build e senza backend.

Unità nuova, una responsabilità:

| Unità | Fa | Si usa così | Dipende da |
| --- | --- | --- | --- |
| Nastro | Accende/spegne rec, tiene un’unica presa, la riproduce una volta, la cancella | Tap spia / tap nuova presa | Motore audio già in uscita (stesso suono che va alle casse); non tocca `fisica.js` |

Il nastro **ascolta** il mix già deformato (dopo tasti, pad, effetti da piega/schiaccia), non rifà gli oscillatori in playback.

`fisica.js` e `audio-params.js` non si modificano per questa feature. Il file `audio/laboratorio.wav` resta inutilizzato come fonte.

## Criteri di accettazione

1. A sinistra dei pad: spia tonda rossa fioca + quadrato «nuova presa»; otto pad ancora tutti visibili.
2. Senza nastro, tap spia: luce rossa forte, si registra quello che si sente (tasti, pad, disco).
3. Tap spia in rec: luce fioca, riascolto una volta di ciò che si è sentito (inclusa la sporcizia del disco), poi silenzio.
4. Tap spia a nastro presente, in silenzio: stesso riascolto una volta.
5. Durante il riascolto, piegare il disco non cambia il nastro; suonare dal vivo si sente sopra ma non si incide.
6. «Nuova presa»: silenzio, nastro via, luce fioca; un tap successivo sulla spia registra da capo.
7. Rec oltre ~60 s: stop da solo e riascolto una volta.
8. Senza audio: testo `audio non disponibile`, luce che può accendersi, nessun nastro da riascoltare.
9. Viewport ~375px: due bottoni + otto pad + tastiera visibili, niente scroll pagina.

## Verifica

Aprire la pagina in browser (non solo screenshot): registrare tasti e un pad, piegare durante la rec, fermare e ascoltare una volta, riascoltare col tap, suonare sopra il nastro, nuova presa e silenzio, rec vuota, rec da un minuto, telefono, audio di sistema spento.
