# Casuale

Generatore di numeri casuali interi da 1 a 100, progettato come pagina web statica senza dipendenze esterne.

## Caratteristiche

- nessun numero viene generato al primo caricamento;
- generazione avviata esclusivamente su richiesta dell’utente;
- algoritmo isolato in `random-generator.js`, separato dall’interfaccia;
- generazione locale nel browser;
- uso di `crypto.getRandomValues()` quando disponibile, con rejection sampling per evitare bias da modulo;
- fallback a `Math.random()` per ambienti legacy;
- interfaccia responsive e accessibile;
- rispetto di `prefers-reduced-motion`;
- nessun framework, font remoto, analytics o asset di terze parti.

## Avvio locale

È sufficiente servire la cartella con un server HTTP statico. Per esempio:

```bash
python3 -m http.server 8080
```

Poi apri `http://localhost:8080`.

## Struttura

```text
.
├── index.html
├── styles.css
├── app.js
├── random-generator.js
└── README.md
```

## Separazione dell'algoritmo

`random-generator.js` non accede al DOM e non contiene logica grafica. Esporta soltanto `generaNumeroCasuale(min, max)`. Le modifiche future alla strategia di generazione possono quindi essere effettuate senza intervenire su `index.html` o sul rendering dell'interfaccia.
