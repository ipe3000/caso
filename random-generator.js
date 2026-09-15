const MIN_CIFRE = 1;
const MAX_CIFRE = 8;
const SOGLIA_PAUSA_MS = 10_000;

const stato = {
  numeroCifre: null,
  ultimoClickMs: null,
  modalitaSpecialeUsata: false,
};

function validaNumeroCifre(numeroCifre) {
  if (!Number.isInteger(numeroCifre) || numeroCifre < MIN_CIFRE || numeroCifre > MAX_CIFRE) {
    throw new RangeError(`Il numero di cifre deve essere compreso tra ${MIN_CIFRE} e ${MAX_CIFRE}.`);
  }
}

function validaGiorno(giorno) {
  if (!Number.isInteger(giorno) || giorno < 1 || giorno > 31) {
    throw new RangeError("Il giorno deve essere un intero compreso tra 1 e 31.");
  }
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

function generaSequenzaSpeciale(numeroCifre, giorno) {
  const decine = Math.floor(giorno / 10);
  const unita = giorno % 10;
  const primaCifra = (decine + unita + numeroCifre) % 10;
  const cifre = [String(primaCifra)];
  let cifraCorrente = primaCifra;

  for (let indice = 1; indice < numeroCifre; indice += 1) {
    const incremento = indice % 2 === 1 ? 3 : 4;
    cifraCorrente = (cifraCorrente + incremento) % 10;
    cifre.push(String(cifraCorrente));
  }

  return cifre.join("");
}

/**
 * Aggiorna la lunghezza selezionata.
 * Cambiare lunghezza prima dell'attivazione speciale azzera il riferimento
 * temporale: la generazione successiva riparte normalmente.
 */
export function impostaNumeroCifre(numeroCifre) {
  validaNumeroCifre(numeroCifre);

  if (stato.numeroCifre !== numeroCifre) {
    stato.numeroCifre = numeroCifre;
    stato.ultimoClickMs = null;
  }

  return true;
}

/**
 * Restituisce la prossima sequenza.
 *
 * Dopo almeno 10 secondi senza click, una sola volta per sessione, il risultato
 * successivo e' deterministico. La prima cifra e' l'ultima cifra della somma
 * tra le due cifre del giorno e il numero di cifre richiesto; le successive
 * avanzano alternando +3 e +4, con aritmetica modulo 10.
 *
 * `momentoRichiestaMs` e `giornoCorrente` rappresentano il momento del click,
 * non quello in cui termina l'animazione dell'interfaccia.
 */
export function generaProssimaSequenza(
  numeroCifre,
  momentoRichiestaMs = Date.now(),
  giornoCorrente = new Date().getDate(),
) {
  validaNumeroCifre(numeroCifre);
  validaGiorno(giornoCorrente);

  if (!Number.isFinite(momentoRichiestaMs)) {
    throw new TypeError("Il momento della richiesta deve essere un numero finito.");
  }

  impostaNumeroCifre(numeroCifre);

  const pausaSufficiente =
    !stato.modalitaSpecialeUsata &&
    stato.ultimoClickMs !== null &&
    momentoRichiestaMs - stato.ultimoClickMs >= SOGLIA_PAUSA_MS;

  const valore = pausaSufficiente
    ? generaSequenzaSpeciale(numeroCifre, giornoCorrente)
    : generaSequenzaPuramenteCasuale(numeroCifre);

  if (pausaSufficiente) {
    stato.modalitaSpecialeUsata = true;
  }

  stato.ultimoClickMs = momentoRichiestaMs;

  return {
    valore,
    bloccaCambioCifre: false,
  };
}
