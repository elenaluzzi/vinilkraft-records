# Vinile da laboratorio — manopole del rack sul suono

Data: 2026-09-11  
Stato: da rileggere  
Estende: spec rack plugin sotto la MPC (look, tasti, cassetto, persistenza visiva)  
Sostituisce, in quella spec, le frasi «il suono non cambia», «girare un controllo non si sente», «il nastro è ignaro delle manopole» e il criterio di accettazione 5 su suono/nastro identici. Look, tasti, cassetto, telefono (niente cassetto sotto 700 px) e testi d’aiuto restano quelli.

## Scopo

Il visitatore, su questo computer, deve sentire i quattro plugin (`REV` `ECO` `EQ` `CMP`) come un rack da studio: le manopole cambiano tasti, pad e disco. All’inizio il suono resta quello delle tre stanze. L’effetto di un plugin si sente quando se ne alza il mix, anche a cassetto chiuso. I quattro possono suonare insieme. Il nastro registra quello che si sente; in riascolto la presa è già la foto e non ripassa dai plugin.

## Fuori ambito

- Altri plugin oltre i quattro
- Aprire il cassetto sul telefono, o dare sul telefono un modo per girare le manopole
- Un pulsante «togli tutto» / bypass generale
- Logo o nomi di marche
- Cambiare disco, pallini, nastro (gesti e tetto 60 s), testi d’aiuto, otto pad sonori, due ottave, 120 BPM
- Cambiare il carattere delle tre stanze (wow giallo, delay/piega, sub violetto, scontro accordi)
- Far sì che il riascolto del nastro venga ricolorato dalle manopole di adesso
- Copia di un plugin commerciale (decine di parametri extra)

## Esperienza

### All’inizio

Come dopo il look MPC + cassetto: disco, tre pallini, nastro, otto pad, quattro tasti plugin, tastiera. Cassetto chiuso. **Suono identico a oggi**, senza coda da `REV`, senza ripetizioni da `ECO`, senza scolpire da `EQ`, senza schiacciare da `CMP`.

I mix dei quattro plugin partono da **zero** (porta chiusa). Le altre manopole partono a metà, pronte: non si sentono finché il mix di quel plugin è a zero.

### Mix = porta

Ogni plugin ha un fader **mix**. Mix a zero: quel plugin non c’è, come se fosse staccato. Mix a fondo: l’effetto è evidente, da laboratorio; la stanza resta riconoscibile. Tra zero e fondo: quanto è presente quel plugin.

Le altre manopole (coda, tempo, gravi, soglia…) preparano il sapore e si sentono **solo** se il mix di quel plugin è sopra zero. Gira `coda` con mix a zero: visivamente si muove e si salva, l’orecchio non cambia.

### Sempre in catena, anche a cassetto chiuso

Apri `REV`, alzi il mix, chiudi il cassetto: il riverbero resta. Stessa cosa per gli altri. Non serve tenere il cassetto aperto per sentire. Puoi avere riverbero *e* eco *e* equalizzatore *e* compressore insieme, ognuno col suo mix.

Ordine fisso (anche a cassetti chiusi):

1. **Equalizzatore** (`EQ`) — gravi, medi, acuti, presenza, brillantezza
2. **Compressore** (`CMP`) — soglia, rapporto, attacco
3. **Eco** (`ECO`) — tempo, ripetizioni
4. **Riverbero** (`REV`) — livello, coda, stanza

Poi si sente (e si registra) il risultato. Prima di questa catena restano intatti gli effetti già esistenti delle stanze e della piega/schiaccia del disco: l’eco «della stanza» non è l’eco del plugin.

Look del cassetto, sigle, latch, tinta `--tema-rgb`: invariati.

### Nastro

Il nastro incide **dopo** la catena: nella presa ci sono i plugin che stavi sentendo. Se durante la registrazione giri una manopola (mix compreso), il nastro prende anche quel cambiamento.

In riascolto la presa è già la foto. I plugin di adesso **non** la ricolorano. Una presa nuova ricomincia dal suono vivo, di nuovo con i plugin.

### Grafico

Il disegno nel cassetto segue **quello che senti** (dopo i plugin). In silenzio o senza audio è quasi fermo. Quattro disegni diversi, stesso ascolto.

### Telefono (larghezza sotto 700 px)

Il cassetto non si apre; i tap sui tasti plugin non restano accesi. I mix salvati, se sopra zero, si sentono lo stesso (la catena è sempre lì). Su un telefono «fresco» i mix sono a zero: suono pulito. Non c’è modo, sotto 700 px, di alzare o abbassare i mix.

### Persistenza

- Pallino stanza: come oggi (`vinile_tema`).
- Manopole/fader: chiave `vinile_rack` su questo computer.
- Default nuovi: mix di ogni plugin **0**; tutti gli altri controlli **0,5**.
- Plugin aperto: non si salva (come oggi).
- Salvataggi scenografici già presenti (senza segno di versione): al primo caricamento di questa feature i **quattro mix si forzano a 0**; coda, tempo, bande, ecc. restano dove erano. Poi si scrive un segno di versione, così un mix alzato dopo non viene riazzerato al ricarico.
- JSON illeggibile: si torna ai default nuovi (mix 0, resto 0,5).
- Archivio pieno: i valori restano per la sessione; al ricarico, se il salvataggio è fallito, default nuovi.

## Errori e limiti

- Audio bloccato: `audio non disponibile` come oggi; cassetto e manopole usabili; grafico quasi fermo.
- WebGL assente: invariato rispetto a oggi (se il disco 3D non parte, resta il limite già noto della pagina).
- Mix a zero su tutti e quattro: orecchio identico alle tre stanze senza questa feature.

## Architettura (implementazione)

Pagina statica, senza build e senza backend. Preview `http://127.0.0.1:8770/index.html`.

La catena plugin sta **dopo** il mix già esistente (stanze + piega/schiaccia) e **prima** di altoparlante, nastro in registrazione e grafico. Il riascolto del nastro va all’altoparlante **senza** ripassare dalla catena.

| Unità | Fa | Si usa così | Dipende da |
| --- | --- | --- | --- |
| `rack.js` | Come oggi, più default mix a 0 e migrazione versione sui mix | `loadParams` / `setParam` | Nessun DOM, nessun audio |
| `audio.js` | Inserisce EQ, compressore, eco, riverbero; applica i params; `getMeterFrame()` preleva **dopo** i plugin | `applyRack(params)` a ogni `setParam` e all’unlock | Web Audio; params da `rack.js` |
| `vinile.js` | Dopo `setParam` chiama `applyRack`; il tick del grafico resta com’è | Come oggi | rack, audio |
| `rack-ui.js` / `pannello-ui.js` / `styles.css` | Invariati nel look; il drag già chiama `setParam` | Come oggi | — |
| `nastro.js` | Invariato nei gesti; il segnale che incide arriva già bagnato da `audio.js` | Come oggi | — |

Flusso:

```
manopola / fader
  → setParam → vinile_rack
  → applyRack(params)
  → se mix plugin = 0, quel blocco è assente dal suono
  → ascolto e rec dopo la catena
  → riascolto nastro → altoparlante, niente catena
```

`tema-suono.js`, `audio-params.js`, `fisica.js` e i testi in `index.html` non cambiano per questa feature.

## Criteri di accettazione

1. All’avvio (o dopo migrazione dei mix scenografici): mix a zero, suono delle tre stanze identico a prima di questa feature; girare coda/tempo/gravi con mix a zero non si sente.
2. Alzare il mix di un plugin colora tasti, pad e disco in modo evidente; chiudere il cassetto non toglie l’effetto.
3. Si possono tenere accesi più plugin insieme; l’ordine percepito è eq, poi compressore, poi eco, poi riverbero.
4. Mix a fondo: effetto da laboratorio, stanza ancora riconoscibile.
5. Nastro in rec: si sente (e si riascolta) con i plugin di quel momento, inclusi i giri di manopola durante la presa.
6. Riascolto: girare i plugin adesso non cambia la presa già incisa.
7. Grafico (cassetto aperto) si muove con quello che si sente dopo i plugin; in silenzio è quasi fermo.
8. Sotto 700 px: cassetto assente; se i mix sono a zero il suono è pulito; look e aiuti invariati; nessun logo.

## Verifica

Aprire `http://127.0.0.1:8770/index.html`. Mix a zero: stanza verde/giallo/violetto come prima (wow, delay di piega, sub). Alzare solo `REV` mix: coda evidente, chiudere il cassetto, la coda resta. Alzare anche `ECO`: si sentono entrambi. Mix di `EQ` e `CMP` a zero: eq/comp non colorano. Registrare una presa con riverbero, poi azzerare il mix `REV`: il riascolto ha ancora il riverbero. Nuova presa con mix a zero: pulita. Ricaricare: mix alzati restano (dopo la prima migrazione). Finestra stretta: niente cassetto, suono secondo i mix salvati.
