# Spec del Titolo Hero di Vision Fest

Solo decisioni già chiuse sulla mappa [Spec del Titolo Hero di Vision Fest](map.md). I nomi in grassetto sono quelli del [glossario](../../CONTEXT.md). Questa spec non è il codice: non tocca `festival-visione.html`.

## 1. Cos’è e cosa non è

Il **Titolo Hero** è le due righe grandi VISION / FEST al centro della homepage di **Vision Fest**.

Non è il **Logo** (“Vision Fest” in alto a sinistra). Non è il **Titolo Scheda** (la linguetta del browser). Non è Vinilkraft.

Data, sottotitolo e bottone biglietti stanno nella homepage ma **fuori** dal Titolo Hero.

## 2. Aspetto fermo

- Testo fisso: prima riga VISION, seconda riga FEST.
- Il Titolo Hero sta in una **Buca** scura. Dentro la Buca c’è solo VISION FEST.
- Data e bottone restano fuori dalla Buca.
- Il **Campo di puntini** continua intorno alla Buca; non si apre a forma di nome e non è l’unica cosa sotto le lettere.
- Il nome fermo ha contrasto almeno 3:1 sul fondo della Buca.

Riferimento visivo della Buca: [festival-visione.prototype-puntini.html](../../festival-visione.prototype-puntini.html)?variant=B (prototipo da buttare).

## 3. Movimento

Regola unica: **Ciclo**. Parte da solo. Non parte da mouse, audio o scroll.

Un **Battito** dura circa **1 secondo**: **Scramble** e **Glitch RGB** insieme.

Poi **Pausa** di **6–7 secondi**: si legge solo VISION FEST, fermo; l’alone è calmo.

Poi di nuovo il Battito.

Durante lo **Scramble** il nome resta **sempre indovinabile**: solo qualche lettera è sbagliata. Non sparisce. Non diventa un blocco illeggibile.

Il **Glitch RGB** è un **Accenno**: un taglio ciano/rosa solo all’attacco del Battito, poi sparisce per tutta la Pausa. Non due copie fantasma per tutto il secondo. Non rumore continuo intorno alle lettere.

I cambi luminosi restano ben sotto 3 al secondo.

Riferimento visivo dell’Accenno: [festival-visione.prototype-glitch.html](../../festival-visione.prototype-glitch.html)?variant=A (prototipo da buttare).

## 4. Quando sta fermo

Il Ciclo gira solo mentre il Titolo Hero è in schermo. Fuori schermo si ferma. Quando torni in cima, il prossimo Battito può partire subito.

Se il sistema chiede **Riduci movimento**: VISION FEST fermo nella Buca, niente Scramble, niente Accenno.

## 5. Telefono

Stesso Ciclo del computer: Battito ~1 s, Pausa 6–7 s, Buca, Scramble indovinabile, Accenno.

Sul telefono cambia solo la dimensione (più piccolo). Non un ritmo più calmo. Non il solo nome fermo (chi vuole zero movimento usa Riduci movimento).

## 6. Sempre uguale

Il Titolo Hero è lo stesso in ogni visita. Non cambia per login, biglietto acquistato o giorno del festival. Login e biglietti restano in menu e area account.

Non ascolta Data Mosh né il fiore 3D. Nessuna regola extra oltre a “fermo fuori schermo”.

## 7. Cosa non fare

Fare il Ciclo descritto sopra. In particolare:

- Un solo innesco: il Ciclo. Non mouse, audio, scroll, webcam o fiore 3D.
- Durante lo Scramble il nome resta indovinabile.
- L’Accenno è un taglio breve all’attacco del Battito, poi via.
- Tra un Battito e l’altro c’è la Pausa di 6–7 s con il nome fermo.
- Fuori schermo il Ciclo è fermo; con Riduci movimento il nome è fermo.
- Una sola macchina su telefono e computer (solo la misura cambia).
- Sempre lo stesso Titolo Hero: niente stati speciali.

## 8. Parole da usare

Usare i termini di [CONTEXT.md](../../CONTEXT.md): Titolo Hero, Logo, Titolo Scheda, Ciclo, Battito, Pausa, Scramble, Glitch RGB, Accenno, Campo di puntini, Buca, Vision Fest.

Non usare al loro posto: titolo, headline, loop, autoplay, shuffle, ghost, ombra, crater, diradamento.
