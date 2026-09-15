/**
 * Restituisce un intero casuale compreso tra min e max, estremi inclusi.
 *
 * Questo modulo e' volutamente indipendente dall'interfaccia: non accede al DOM,
 * non gestisce animazioni e non contiene stato grafico. Le future modifiche
 * all'algoritmo di estrazione possono quindi essere isolate in questo file.
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
