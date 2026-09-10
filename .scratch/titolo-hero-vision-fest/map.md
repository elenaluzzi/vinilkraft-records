# Spec del Titolo Hero di Vision Fest

Label: `wayfinder:map`

## Destination

Una spec che fissa aspetto e comportamento del Titolo Hero di Vision Fest (VISION / FEST in homepage), da usare dopo per realizzarlo senza rimpicciolire a occhio ogni volta. La base da raffinare è lo scramble + Glitch RGB già in pagina.

## Notes

- Dominio: Vision Fest (non Vinilkraft). Glossario in `CONTEXT.md`.
- Skill da consultare in ogni sessione: grilling, domain-modeling, prototype (quando il ticket è `prototype`).
- L’utente non è un programmatore: domande e ticket in italiano, scelte di prodotto sue, scelte tecniche dell’agente.
- Pagina monolitica `festival-visione.html`; niente backend, niente build.
- Questa mappa **pianifica**: produce decisioni, non la spec scritta e non l’implementazione finale. La spec si scrive quando il frontier è vuoto.
- Logo e Titolo Scheda sono fuori da questa mappa.

## Decisions so far

- [Cosa rende un titolo cinetico ancora leggibile](issues/01-leggibilita-tipo-cinetico.md): W3C — pausa/Riduci movimento se il Ciclo non finisce; <3 flash/s; titolo fermo con Riduci movimento; contrasto ≥ 3:1.
- [Il Titolo Hero si muove da solo o reagisce](issues/02-si-muove-da-solo-o-reagisce.md): Ciclo automatico, stesso Battito per Scramble e Glitch RGB, fermo fuori schermo.
- [Il Titolo Hero e il Campo di puntini](issues/06-titolo-hero-e-campo-di-puntini.md): Buca — solo VISION FEST nel bacino scuro; data e bottone fuori.
- [Quanto deve restare leggibile VISION FEST](issues/03-quanto-resta-leggibile.md): Sempre indovinabile; solo qualche lettera sbagliata, mai un blocco illeggibile.
- [Ritmo e durata dello scramble](issues/04-ritmo-e-durata-dello-scramble.md): Battito ~1 s, Pausa 6–7 s, poi di nuovo.
- [Intensità del Glitch RGB](issues/05-intensita-del-glitch-rgb.md): Accenno — taglio ciano/rosa solo all’attacco del Battito.
- [Stesso trattamento su telefono e computer](issues/07-stesso-trattamento-su-telefono.md): Stesso Ciclo; sul telefono solo più piccolo.
- [Il Titolo Hero ha stati speciali](issues/08-stati-speciali-del-titolo-hero.md): Sempre lo stesso; niente stati per login, biglietto o giorno del festival.
- [Il Titolo Hero e le altre animazioni della pagina](issues/09-convivenza-con-altre-animazioni.md): Ignora Data Mosh e fiore 3D; basta la regola fuori schermo.
- [Come è fatta la spec del Titolo Hero](issues/10-struttura-della-spec.md): Otto sezioni in ordine: cos’è, fermo, movimento, quando sta fermo, telefono, sempre uguale, non fare, parole.

## Not yet specified

Niente. Destinazione raggiunta: [spec.md](spec.md).

## Out of scope

- Logo in navigazione: non è il Titolo Hero.
- Titolo Scheda del browser: non è il Titolo Hero.
- Vinilkraft e il suo logo animato.
- Lineup, biglietti, account, installazioni visive.
- Implementare la versione finale in pagina: la destinazione è la spec, non il codice di produzione.
