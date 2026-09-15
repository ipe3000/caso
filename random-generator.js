const MIN_CIFRE = 1;
const MAX_CIFRE = 8;
const SOGLIA_PAUSA_MS = 10_000;

const stato = {
  numeroCifre: null,
  ultimoRisultato: null,
  ultimoClickMs: null,
  specialiRimanenti: 0,
  modalitaSpecialeUsata: false,
};

function validaNumeroCifre(numeroCifre) {
  if (!Number.isInteger(numeroCifre) || numeroCifre < MIN_CIFRE || numeroCifre > MAX_CIFRE) {
    throw new RangeError(`Il numero di cifre deve essere compreso tra ${MIN_CIFRE} e ${MAX_CIFRE}.`);
  }
}

function momentoCorrenteMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}

/**
 * Restituisce un intero casuale compreso tra min e max, estremi inclusi.
 * Usa crypto.getRandomValues() quando disponibile e rejection sampling
 * per evitare bias da modulo.
 */
export function generaNumeroCasuale(min, max) {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
    throw new TypeError("Gli estremi devono essere numeri interi sicuri.");
  }

  if (max < min) {
    throw new RangeError("Il valore massimo deve essere maggiore o uguale al minimo.");
  }

  const ampiezza = max - min + 1;

  if (ampiezza > 0x100000000) {
    throw new RangeError("L'intervallo richiesto e' troppo ampio per questo algoritmo.");
  }

  if (globalThis.crypto?.getRandomValues) {
    const spazio = 0x100000000;
    const limiteAccettato = Math.floor(spazio / ampiezza) * ampiezza;
    const buffer = new Uint32Array(1);
    let valore;

    do {
      globalThis.crypto.getRandomValues(buffer);
      valore = buffer[0];
    } while (valore >= limiteAccettato);

    return min + (valore % ampiezza);
  }

  return min + Math.floor(Math.random() * ampiezza);
}

function generaSequenzaPuramenteCasuale(numeroCifre) {
  const ampiezza = 10 ** numeroCifre;
  const valore = generaNumeroCasuale(0, ampiezza - 1);

  return String(valore).padStart(numeroCifre, "0");
}

function trasformaDeterministicamente(precedente) {
  return [...precedente]
    .map((carattere, indice) => {
      const cifra = Number(carattere);
      const variazione = indice % 2 === 0 ? 1 : -1;
      return String((cifra + variazione + 10) % 10);
    })
    .join("");
}

/**
 * Aggiorna la lunghezza selezionata.
 *
 * Prima dell'attivazione speciale, cambiare lunghezza azzera il riferimento
 * temporale e il risultato precedente. Durante i due risultati speciali il
 * cambio di lunghezza viene rifiutato.
 */
export function impostaNumeroCifre(numeroCifre) {
  validaNumeroCifre(numeroCifre);

  if (stato.specialiRimanenti > 0 && stato.numeroCifre !== numeroCifre) {
    return false;
  }

  if (stato.numeroCifre !== numeroCifre) {
    stato.numeroCifre = numeroCifre;
    stato.ultimoRisultato = null;
    stato.ultimoClickMs = null;
  }

  return true;
}

/**
 * Restituisce la prossima sequenza.
 *
 * Dopo almeno 10 secondi senza click, una sola volta per sessione, i due
 * risultati successivi sono deterministici. Ogni cifra del risultato
 * precedente viene modificata alternando +1 e -1 con aritmetica modulo 10.
 * Il secondo risultato speciale deriva dal primo.
 *
 * `momentoRichiestaMs` rappresenta il momento del click, non quello in cui
 * termina l'animazione dell'interfaccia.
 */
export function generaProssimaSequenza(numeroCifre, momentoRichiestaMs = momentoCorrenteMs()) {
  validaNumeroCifre(numeroCifre);

  if (!Number.isFinite(momentoRichiestaMs)) {
    throw new TypeError("Il momento della richiesta deve essere un numero finito.");
  }

  if (!impostaNumeroCifre(numeroCifre)) {
    throw new Error("Non e' possibile cambiare il numero di cifre durante la sequenza speciale.");
  }

  const pausaSufficiente =
    !stato.modalitaSpecialeUsata &&
    stato.specialiRimanenti === 0 &&
    stato.ultimoRisultato !== null &&
    stato.ultimoClickMs !== null &&
    momentoRichiestaMs - stato.ultimoClickMs >= SOGLIA_PAUSA_MS;

  if (pausaSufficiente) {
    stato.specialiRimanenti = 2;
  }

  let valore;

  if (stato.specialiRimanenti > 0) {
    valore = trasformaDeterministicamente(stato.ultimoRisultato);
    stato.specialiRimanenti -= 1;

    if (stato.specialiRimanenti === 0) {
      stato.modalitaSpecialeUsata = true;
    }
  } else {
    valore = generaSequenzaPuramenteCasuale(numeroCifre);
  }

  stato.ultimoRisultato = valore;
  stato.ultimoClickMs = momentoRichiestaMs;

  return {
    valore,
    bloccaCambioCifre: stato.specialiRimanenti > 0,
  };
}
