# Cosa rende un titolo cinetico ancora leggibile

Fonti primarie W3C/CSS, per il Titolo Hero (Scramble + Glitch RGB, Ciclo, Buca). Non è una spec: sono vincoli da usare nei ticket successivi.

## Sintesi per i ticket

- Un Ciclo che riparte da solo e non finisce entro 5 secondi è **movimento automatico in parallelo** al resto della pagina: serve un modo per metterlo in pausa/fermarsi/nasconderlo, oppure spegnerlo quando il sistema chiede meno movimento. ([WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))
- Non più di **3 lampeggi al secondo** su un’area grande e luminosa. Il Titolo Hero è grande: niente strobo, niente Glitch RGB che batte come un flash. ([WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html))
- Chi ha disturbi vestibolari può avere vertigini e nausea dal movimento extra. Con **Riduci movimento** del sistema, Scramble e Glitch RGB devono spegnersi: resta VISION FEST fermo. ([WCAG 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html), [CSS prefers-reduced-motion](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion))
- Testo grande: contrasto almeno **3:1** sul fondo. La Buca aiuta. Durante lo Scramble le lettere casuali non devono diventare un lampeggio chiaro/scuro. ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))

## 2.2.2 Pausa, stop, nascondi (Livello A)

Per informazioni che si muovono, lampeggiano, scorrono o si aggiornano da sole, durano più di cinque secondi e stanno **insieme** ad altro contenuto, deve esserci un meccanismo per pausa, stop o nascondere, salvo che il movimento sia essenziale. ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [WCAG 2.2](https://www.w3.org/TR/WCAG22/#pause-stop-hide))

«Starts automatically» include ciò che parte **senza** un click voluto, e anche hover/focus/scroll in vista. ([Understanding 2.2.2, Intent](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))

I cinque secondi: abbastanza per attirare l’attenzione, non così lunghi che chi si distrae non possa aspettare per usare la pagina. Il movimento continuo distrae chi ha deficit di attenzione e chi fatica a leggere testo che non sta fermo. ([Understanding 2.2.2, Intent](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))

**Sul Titolo Hero:** il Ciclo è automatico e, se i Battiti si ripetono senza fine, dura più di cinque secondi. La spec dovrà prevedere o Battiti brevi con pause ferme lunghe, o un modo unico per fermare il movimento (e, meglio, rispettare Riduci movimento). Fermarsi solo «finché il mouse sta sopra» **non** conta come pausa. ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))

## 2.3.1 Tre lampeggi o sotto soglia (Livello A)

Niente che lampeggi più di tre volte in un secondo, oppure il lampeggio deve stare sotto le soglie di area e luminosità. Serve a evitare crisi da fotosensibilità; il rosso saturo è più pericoloso. ([Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html))

«Flashing» = coppia di cambi di luminanza che può provocare crisi se è grande e nella fascia di frequenza giusta. «Blinking» = cambio di stato per attirare l’attenzione: può durare poco se poi si ferma; se va oltre 3/s diventa anche flash. ([Understanding 2.3.1, note blinking vs flashing](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html))

Area di riferimento: circa 341 × 256 pixel CSS. Il Titolo Hero a ~6rem è grande: va trattato come area da non far strobarare. ([Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html))

**Sul Titolo Hero:** lo Scramble che cambia glifi non è di per sé un flash, ma un Glitch RGB a scatti su lettere grandi e chiare può diventarlo se i cambi di luminanza sono rapidi e ampi. Tenere i Battiti ben sotto 3 al secondo; tra un Battito e l’altro il nome fermo (già deciso).

## 2.3.3 Animazione dalle interazioni (Livello AAA)

L’animazione di movimento innescata da un’interazione deve potersi spegnere, salvo che sia essenziale. ([WCAG 2.2 2.3.3](https://www.w3.org/TR/WCAG22/#animation-from-interactions), [Understanding 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html))

Il Ciclo **non** parte da un’interazione (è automatico): qui conta soprattutto 2.2.2. 2.3.3 resta utile perché il W3C collega il movimento extra ai **disturbi vestibolari** (vertigini, nausea, emicrania, bisogno di sdraiarsi) e indica tre vie: niente animazione inutile, un controllo per spegnerla, o `prefers-reduced-motion`. ([Understanding 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html))

«Motion animation» = passi in mezzo che danno illusione di movimento o transizione fluida; non include di solito solo cambio di colore, blur o opacità senza cambio di posizione/forma. Lo Scramble (lettere che cambiano) e lo sfalsamento del Glitch RGB sono movimento percepito del testo. ([WCAG 2.2, definizione motion animation](https://www.w3.org/TR/WCAG22/#dfn-motion-animation))

## prefers-reduced-motion

`prefers-reduced-motion: reduce` = l’utente ha chiesto un’interfaccia che toglie o sostituisce le animazioni di movimento che danno fastidio a chi ha ipersensibilità vestibolare o distraggano chi ha deficit di attenzione. ([CSS Media Queries 5](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion))

**Sul Titolo Hero:** con reduce, nessun Scramble e nessun Glitch RGB; VISION FEST fermo nella Buca.

## 1.4.3 Contrasto minimo (Livello AA)

Testo normale ≥ 4,5:1; testo grande ≥ 3:1. Il testo di un logo/marchio è esente. ([Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))

Il Titolo Hero è grande e anche marchio; restare sopra 3:1 sul fondo della Buca è comunque la scelta sicura. Durante lo Scramble, lettere casuali chiare su fondo scuro tengono il contrasto; overlay ciano/magenta non devono coprire il nome fino a spegnerlo.

## Cosa è illeggibile o nauseante (solo da queste fonti)

| Scelta | Perché |
| --- | --- |
| Ciclo senza fine senza pausa/Riduci movimento | 2.2.2: movimento automatico > 5 s in parallelo |
| Lampeggi > 3/s sull’area del titolo | 2.3.1: rischio crisi |
| Parallasse o movimento extra legato a scroll/hover senza spegnimento | 2.3.3: rischio vestibolare (già evitato: niente innesco da scroll) |
| Ignorare Riduci movimento | CSS MQ5 + 2.3.3: l’utente ha chiesto di togliere quel movimento |
| Testo che si muove mentre si deve leggere altro | 2.2.2 Intent: chi legge piano o ha ADHD resta bloccato |
| Flash rosso saturo sul titolo | 2.3.1: il rosso è più pericoloso |

## Cosa tiene il testo sopportabile

- Battito breve, poi nome **fermo** abbastanza da poterlo leggere (allineato ai 5 s come orizzonte, non come obbligo di animare 5 s).
- Frequenza dei cambi luminosi **ben sotto 3/s**.
- Con Riduci movimento: titolo statico.
- Contrasto del nome fermo ≥ 3:1 sulla Buca.
- Durante lo Scramble: il nome resta almeno **indovinabile**, così il movimento non è l’unico modo di sapere che c’è scritto VISION FEST (2.2.2: il testo che si muove è più difficile da leggere).
