# Spec del Corridoio

Label: `wayfinder:map`

## Destination

Una spec che fissa aspetto e comportamento di un Corridoio liminale (passaggio stretto, scuro, neon, Acquari impilati sulle pareti come in un negozio di pesci senza cassa) che riempie la pagina, da usare dopo per realizzarla come pagina autonoma in `testacq`. Non è un gioco: niente punteggio, vite o livelli. Niente Monitor, niente Piscina, niente computer come oggetto.

## Notes

- Dominio: Corridoio (non Vision Fest, non Vinilkraft). Glossario in `testacq/CONTEXT.md`. Mappa dei contesti in `CONTEXT-MAP.md`.
- Skill da consultare in ogni sessione: grilling, domain-modeling, prototype (quando il ticket è `prototype`), research (quando il ticket è `research`).
- L’utente non è un programmatore: domande e ticket in italiano, scelte di prodotto sue, scelte tecniche dell’agente.
- Pagina statica in `testacq`: HTML, CSS e JavaScript vanilla; niente backend, niente build.
- Questa mappa **pianifica**: produce decisioni, non la spec scritta e non l’implementazione finale. La spec si scrive quando il frontier è vuoto.
- Vision Fest, Vinilkraft, il computer-come-oggetto e la Piscina sono fuori da questa mappa.
- Lo sforzo è partito come «Acquario nel Monitor», poi Piscina; la destinazione è stata ridisegnata sul Corridoio.

## Decisions so far

- [Si vede la stanza o solo il Monitor](issues/02-stanza-o-solo-monitor.md): Il Luogo è la pagina. Niente Monitor, niente scrivania.
- [L’Acquario si guarda o si tocca](issues/04-si-guarda-o-si-tocca.md): Sguardo — volti la testa col dito; niente camminare né toccare.
- [Il Luogo è il Corridoio](issues/10-il-luogo-e-il-corridoio.md): Corridoio stretto, scuro, neon, Acquari a destra e a sinistra. Niente Piscina, niente cassa.
- [Come si gira lo Sguardo sul computer](issues/09-sguardo-sul-computer.md): Stesso gesto — mouse o trackpad come il dito.
- [Dove sei nel Corridoio](issues/11-dove-sei-nel-corridoio.md): In mezzo — Acquari vicini a destra e a sinistra.
- [Il Corridoio finisce o continua](issues/12-il-corridoio-finisce-o-continua.md): Continua — nessun arrivo visibile.

## Not yet specified

- Chi e cosa vive negli Acquari (pesci, piante, decorazioni) — dipende da se le vasche sono uguali o diverse.
- Stesso trattamento su telefono e computer (oltre lo Sguardo, già deciso).
- Come si chiama questo pezzo.
- Come è fatta la spec (sezioni e ordine).

## Out of scope

- Vision Fest e Vinilkraft: il Corridoio è una pagina autonoma.
- Gioco con punteggio, vite, livelli o fallimento.
- Account, backend, salvataggio su server.
- Implementare la versione finale in pagina: la destinazione è la spec, non il codice di produzione.
- Monitor e computer come oggetto (scrivania, cornice, interfaccia nel vetro). [Che computer è il Monitor](issues/03-che-computer-e-il-monitor.md), [Nel vetro c’è solo l’acqua o anche l’interfaccia](issues/05-acqua-o-interfaccia-nel-vetro.md), [Come si presentavano gli acquari da computer anni 80](issues/01-acquari-da-computer-anni-80.md).
- Piscina, Bordo, acqua Piena da nuoto, negozio con cassa: il Luogo è il Corridoio. [Dove sei nella Piscina](issues/07-dove-sei-nella-piscina.md), [L’acqua quanto riempie la Piscina](issues/08-acqua-quanto-riempie.md).
