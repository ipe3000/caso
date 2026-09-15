const MIN_CIFRE = 1;
const MAX_CIFRE = 8;

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

/**
 * Genera una sequenza numerica casuale a lunghezza fissa.
 * Gli zeri iniziali sono significativi: con 4 cifre, "0042" e' valido.
 *
 * Il modulo resta indipendente dal DOM e dall'interfaccia.
 */
export function generaSequenzaCasuale(numeroCifre) {
  if (!Number.isInteger(numeroCifre) || numeroCifre < MIN_CIFRE || numeroCifre > MAX_CIFRE) {
    throw new RangeError(`Il numero di cifre deve essere compreso tra ${MIN_CIFRE} e ${MAX_CIFRE}.`);
  }

  const ampiezza = 10 ** numeroCifre;
  const valore = generaNumeroCasuale(0, ampiezza - 1);

  return String(valore).padStart(numeroCifre, "0");
}
