# Vinile da laboratorio — tre stanze di suono (verde / giallo / violetto)

Data: 2026-09-10  
Stato: da rileggere  
Estende: spec sintetizzatore, spec nastro, e i tre pallini colore già in pagina  
Sostituisce, nella spec sintetizzatore, l’assunto di **un solo timbro** per tasti, pad e disco: il suono segue il pallino colore. Look, gesti, nastro, testi d’aiuto e file `audio/laboratorio.wav` (inutilizzato come fonte) restano quelli già approvati.

## Scopo

I tre pallini in alto a destra non cambiano solo il colore. Sono tre **stanze**: stesso disco, stessi tasti, stessi otto pad, stesso nastro — carattere sonoro diverso. Il visitatore capisce all’orecchio, senza nomi sui pad e senza controlli nuovi.

## Fuori ambito

- Caricare un file, scegliere un brano, streaming, playlist
- Pulsanti, manopole o testi extra oltre ai tre pallini già in pagina
- Cambiare il numero di pad o di tasti, o il tempo (resta 120 in 4/4)
- Cambiare il suono del **verde** (resta il laboratorio di oggi)
- Nomi visibili su tasti o pad
- Far sì che il disco deformi il nastro già inciso (invariato)

## Esperienza

All’apertura: il pallino salvato l’ultima volta (`vinile_tema`). Il suono di tasti, pad e disco è quello di quella stanza. Se non c’è un salvataggio, **verde**.

Cambio pallino mentre si suona: i pad restano accesi o spenti come erano; le note tenute restano tenute. **La stanza cambia subito**: stesso gesto, suono nuovo. Una presa nastro già in corso registra anche quel salto.

Niente file da caricare. In giallo «elaborare una canzone» significa suonare una melodia morbida sui tasti sopra i letti e le percussioni delicate.

### Verde — laboratorio (invariato)

Tasti aspri da laboratorio, batteria e timbri già in pagina, disco che sporca e glitcha, click aspro allo schiaccia. Ordine pad e griglia: quelli di oggi.

### Giallo — studio caldo

Tutta la stanza è più tenue del verde (tasti e pad). Tasti morbidi, da canzone (non un piano acustico: ancora elettronici, ma tenui). Coda della nota un po’ più lunga e dolce.

Piegare il disco: riscalda e fa oscillare piano (un leggero «wow», eco corta). Niente sporcizia, stutter o glitch da laboratorio.  
Schiacciare: colpetto morbido.  
Se non suona niente, piegare è solo visivo; uno schiacciamento può comunque fare il colpetto.

Otto pad, da sinistra a destra:

| # | Ruolo | Come suona |
| --- | --- | --- |
| 1 | Cassa soffice | Colpo sulla griglia, grave e rotondo |
| 2 | Spazzola | Colpo sulla griglia, rullante delicato |
| 3 | Hi-hat leggero | Colpo sulla griglia, corto e chiaro |
| 4 | Clap piano | Colpo sulla griglia, palmo morbido |
| 5 | Basso | Letto ritmico sulla griglia, linea grave tenue |
| 6 | Accordi | Tappeto: parte all’accensione, resta finché il pad è acceso, respiro ogni battuta |
| 7 | Arpeggio | Letto ritmico, note che salgono piano sulla griglia |
| 8 | Aria | Tappeto: soffio continuo finché il pad è acceso |

1–4 sono colpi: partono al prossimo passo della griglia, come i pad di oggi. 5 e 7 (basso, arpeggio) idem, sulla griglia. 6 e 8 (accordi, aria) partono subito all’accensione e tacciono allo spegnimento.

### Violetto — stanza buia

Tasti lunghi e cavernosi: la nota resta in aria (coda più lunga del giallo). Registro un po’ più cupo del verde.

Piegare: allunga e inghiotte (eco profonda, tono che scende).  
Schiacciare: un’eco che si chiude, non uno scatto aspro.  
Silenzio + piega: solo visivo; schiacciare può comunque fare l’eco che si chiude.

Otto pad, da sinistra a destra:

| # | Ruolo | Come suona |
| --- | --- | --- |
| 1 | Rombo grave | Colpo sulla griglia, sub che cresce e cala |
| 2 | Metallo | Colpo sulla griglia, ferro breve |
| 3 | Impulso lento | Colpo sulla griglia, meno denso della cassa verde |
| 4 | Cristallo | Colpo sulla griglia, ping acuto e corto |
| 5 | Coro | Tappeto: voci cave continue finché il pad è acceso |
| 6 | Onda al contrario | Tappeto: risacca che respira sulla battuta |
| 7 | Basso scuro | Tappeto: pedale grave continuo |
| 8 | Bussare | Colpo sulla griglia, legno lontano |

1–4 e 8 sono colpi: prossimo passo della griglia. 5–7 sono tessuti: partono subito all’accensione e tacciono allo spegnimento.

## Come si suona (invariato tra stanze)

- Tasti: solo mentre li tieni; più tasti insieme ammessi; nessuna etichetta di nota.
- Pad: tap accende il loop, tap spegne; più pad sovrapposti.
- Tempo fisso 120, griglia in 4/4. Piegare o schiacciare **non** cambia la velocità.
- Niente tasto panic: si spegne tapando ogni pad acceso.
- Testi d’aiuto: quelli già in spec sintetizzatore. Nessuna frase nuova sui colori.

## Nastro

Invariato nel funzionamento. Incide **quello che si sente**, inclusa la stanza attiva e un eventuale cambio pallino a metà presa. Al riascolto il disco non rimodifica il nastro.

## Errori e limiti

- Audio bloccato: `audio non disponibile`; disco, tasti, pad e pallini restano visivi; i pad possono accendersi di luce senza suono.
- WebGL assente: invariato.
- Telefono: stessi tre pallini, stessa barra; nessun controllo extra.

## Architettura (implementazione)

Pagina statica, senza build e senza backend.

Il verde deve restare udibile come oggi: stessi timbri tasti/pad e stessa catena disco (distorsione, filtro, delay, glitch, stutter). Giallo e violetto sono **profili** che sostituiscono voce tasti, sintesi pad e mappa piega/schiaccia → effetti.

| Unità | Fa | Si usa così | Dipende da |
| --- | --- | --- | --- |
| Profilo stanza (modulo testabile, es. accanto a `temi.js`) | Id tema → voce tasti, tipo pad 0–7, mappa effetti disco | Funzioni pure | Solo id tema + numeri `piega`/`schiaccia` |
| `audio-params.js` | Effetti disco **per stanza** | `effectParams(piega, schiaccia, tema)` | Profilo; senza tema o `verde` = numeri attuali |
| `audio.js` | Oscillatori / tappeti / colpi; al cambio tema ritimbra voci tenute e i pad già accesi | `setTheme(id)` oltre a `setPads` / `noteOn` | Profilo, Web Audio |
| `temi.js` / `vinile.js` | Look e persistenza pallini, già esistenti | Come oggi; dopo `applyTheme` avvisa l’audio | Nessun nuovo controllo UI |

Flusso:

```
pallino → tema visivo + setTheme
gesto tasto/pad → stato pannello (invariato)
gesto disco → piega, schiaccia
             → effectParams(..., tema)
             → motore audio
```

Tappeti (accordi, aria, coro, onda, basso scuro): voce tenuta mentre il pad è acceso, non un one-shot a ogni sedicesimo. Colpi e letti ritmici (basso, arpeggio): restano sulla griglia a 120.

`fisica.js`, markup, testi e bottoni nastro non cambiano per questa feature.

## Criteri di accettazione

1. Verde: tasti, otto pad e disco suonano come prima di questa feature.
2. Giallo: tasti tenui a coda media; pad 1–4 percussione delicata; pad 5–8 basso, accordi, arpeggio, aria; disco caldo/oscillante, schiaccia morbido, senza glitch da laboratorio.
3. Violetto: tasti lunghi e cupi; pad nell’ordine rombo, metallo, impulso, cristallo, coro, onda, basso scuro, bussare; disco che allunga/inghiotte; schiaccia = eco che si chiude.
4. Cambio pallino a pad accesi e tasti tenuti: il suono diventa subito quello della nuova stanza; i pad non si spengono da soli.
5. Tempo 120 e gesti disco/tasti/pad/nastro invariati; nessun file da caricare; nessun controllo nuovo.
6. Tema persistente: ricaricare la pagina ripristina pallino **e** stanza sonora.
7. Nastro: una presa può contenere un cambio di stanza; il riascolto è quello stampo.
8. Senza audio: `audio non disponibile`, UI invariata.

## Verifica

Aprire la pagina in browser (non solo screenshot): ascoltare i tre pallini sui tasti e su tutti e otto i pad; piegare e schiacciare in ciascuna stanza; cambiare pallino a pad accesi; tenere un tasto e cambiare colore; registrare un nastro che attraversa un cambio; ricaricare e controllare che il colore salvato porti il suono giusto; telefono; audio di sistema spento.
