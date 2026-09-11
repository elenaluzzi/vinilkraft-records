# Vinile da laboratorio — pavimento Superstudio sotto il disco

Data: 2026-09-11  
Stato: da rileggere  
Estende: spec laboratorio, look MPC, tre stanze di suono  
Non sostituisce altre spec: aggiunge un suolo visivo. Suono, nastro, rack, tasti, pad, piega e schiaccia **non** cambiano.

## Scopo

Il visitatore deve vedere il vinile **appoggiato su un pavimento nero a quadretti**, con righine bianche sottili in prospettiva, come una superficie Superstudio. Il suolo è fermo. Il disco si piega e si schiaccia sopra, senza deformare i quadretti.

## Fuori ambito

- Quadretti sulla MPC, sui testi, sui pallini o sul resto della pagina
- Pareti a griglia, cielo a quadretti, “gabbia” intorno al disco
- Colorare i quadretti con la stanza (verde / giallo / violetto)
- Far muovere o pulsare la griglia da sola
- Ombra del disco sul pavimento, riflessi specchiati, orizzonte da cartolina
- Cambiare testi d’aiuto, suono, nastro, rack, pad, tasti, due ottave, 120 BPM
- Logo o citazioni di Superstudio in pagina

## Esperienza

All’apertura, nello spazio del disco: pavimento nero, linee bianche sottili, dritte, a maglia quadrata. Verso il fondo i quadretti diventano più piccoli (prospettiva vera). Verso l’alto, oltre il bordo del suolo, resta lo scuro della stanza (il colore pagina già usato dai tre pallini), **senza** griglia.

Il disco sta **sopra** il suolo, un po’ staccato, come un oggetto su un pavimento. Non affonda nei quadretti.

Piegare e schiacciare: solo il vinile si deforma. I quadretti restano immobili.

Cambio pallino stanza: disco e luci dei tasti cambiano come oggi. Il pavimento resta bianco su nero.

Telefono e computer: stesso suolo sotto il disco. Niente controllo nuovo per accenderlo o spegnerlo.

## Look

- Fondo del suolo: nero
- Linee: bianco, **sottili** (un filo, non un quaderno a quadretti grossi)
- Maglia regolare; niente diagonali
- Il suolo è molto più largo del disco, così sembra infinito; ai bordi lontani le linee si perdono nello scuro, senza un rettangolo tagliato netto
- Niente neon, niente spessore 3D delle linee, niente texture “plastica”

## Errori e limiti

- WebGL assente: messaggio già esistente; niente pavimento (niente scena)
- Audio bloccato: invariato; il suolo si vede lo stesso
- Rack aperto: il disco cede spazio come oggi; il pavimento resta sotto il disco, nello stesso spazio 3D

## Architettura (implementazione)

Pagina statica, preview `http://127.0.0.1:8770/index.html`.

Il suolo è un piano orizzontale nella scena 3D del canvas `#stage`, **sotto** il disco, non uno sfondo CSS della pagina.

| Unità | Fa | Si usa così | Dipende da |
| --- | --- | --- | --- |
| `pavimento.js` | Crea il piano a quadretti (nero + linee bianche sottili da coordinate del mondo) | `creaPavimento()` → oggetto da aggiungere alla scena | Three.js già in pagina |
| `vinile.js` | Aggiunge il suolo alla scena, leggermente sotto il disco | Una chiamata all’avvio | `pavimento.js` |
| `temi.js` / CSS pagina | Invariati per i colori pagina; il suolo **non** legge `--tema-rgb` | Come oggi | — |

`fisica.js`, `audio.js`, `nastro.js`, `rack.js`, `pannello-ui.js`, testi in `index.html`: invariati.

## Criteri di accettazione

1. Sotto il disco si vede un pavimento nero a quadretti bianchi sottili, in prospettiva.
2. MPC, testi e pallini non hanno quadretti.
3. Piegare / schiacciare non deforma il pavimento.
4. Cambio stanza: pavimento sempre bianco su nero; disco e tasti cambiano come oggi.
5. Suono, nastro, rack e testi d’aiuto identici a prima di questa feature.
6. Nessun nuovo bottone, nessuna scritta Superstudio.

## Verifica

Aprire `http://127.0.0.1:8770/index.html`: il disco poggia su un suolo a griglia. Piegare, schiacciare, cambiare i tre pallini, aprire un plugin sul computer, suonare. Controllare che i quadretti restino fermi e bianchi su nero, e che la macchina in basso non abbia la griglia.
