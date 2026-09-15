# Casuale

Generatore di sequenze numeriche casuali da 1 a 8 cifre, progettato come pagina web statica senza dipendenze esterne.

## Caratteristiche

- 4 cifre selezionate di default;
- selettore compatto da 1 a 8 cifre;
- gli zeri iniziali sono ammessi e mantenuti: con 4 cifre, `0042` e' un risultato valido;
- nessun risultato viene generato al primo caricamento o al cambio del numero di cifre;
- generazione avviata esclusivamente su richiesta dell'utente;
- una pressione del pulsante corrisponde a una sola estrazione;
- algoritmo isolato in `random-generator.js`, separato dall'interfaccia;
- generazione locale nel browser;
- uso di `crypto.getRandomValues()` quando disponibile, con rejection sampling per evitare bias da modulo;
- fallback a `Math.random()` per ambienti legacy;
- interfaccia responsive e accessibile;
- rispetto di `prefers-reduced-motion`;
- nessun framework, font remoto, analytics o asset di terze parti.

## Avvio locale

E' sufficiente servire la cartella con un server HTTP statico. Per esempio:

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

`random-generator.js` non accede al DOM e non contiene logica grafica. Esporta `generaNumeroCasuale(min, max)` e `generaSequenzaCasuale(numeroCifre)`. La seconda funzione restituisce una stringa a lunghezza fissa e conserva gli zeri iniziali. Le modifiche future alla strategia di generazione possono quindi essere isolate nel modulo senza incorporare logica casuale nell'interfaccia.
