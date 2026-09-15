const MIN_CIFRE = 1;
const MAX_CIFRE = 8;
const SOGLIA_PAUSA_MS = 10_000;
const TIME_API_TIMEOUT_MS = 500;
const TIME_API_URL =
  "https://timeapi.io/api/Time/current/zone?timeZone=Europe%2FRome";

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

function giornoDalTempoRemoto(data, momentoClickMs) {
  const campiRichiesti = [
    data?.year,
    data?.month,
    data?.day,
    data?.hour,
    data?.minute,
    data?.seconds,
  ];

  if (!campiRichiesti.every(Number.isInteger)) {
    throw new TypeError("La risposta del servizio orario non e' valida.");
  }

  const milliSeconds = Number.isInteger(data.milliSeconds) ? data.milliSeconds : 0;
  const tempoRemotoLocale = Date.UTC(
    data.year,
    data.month - 1,
    data.day,
    data.hour,
    data.minute,
    data.seconds,
    milliSeconds,
  );
  const ritardoDalClick = Math.max(0, Date.now() - momentoClickMs);
  const istanteStimatoDelClick = new Date(tempoRemotoLocale - ritardoDalClick);

  return istanteStimatoDelClick.getUTCDate();
}

async function ottieniGiornoAffidabile(momentoClickMs, giornoFallback) {
  validaGiorno(giornoFallback);

  if (typeof fetch !== "function" || typeof AbortController !== "function") {
    return giornoFallback;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIME_API_TIMEOUT_MS);

  try {
    const response = await fetch(TIME_API_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`TimeAPI ha risposto con stato ${response.status}.`);
    }

    const data = await response.json();
    const giorno = giornoDalTempoRemoto(data, momentoClickMs);
    validaGiorno(giorno);
    return giorno;
  } catch {
    return giornoFallback;
  } finally {
    clearTimeout(timeoutId);
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
 * successivo e' deterministico. La data viene richiesta a TimeAPI per
 * Europe/Rome con timeout di mezzo secondo; in caso di errore viene usato il
 * giorno locale del browser rilevato al click.
 */
export async function generaProssimaSequenza(
  numeroCifre,
  momentoRichiestaMs = Date.now(),
  giornoFallback = new Date(momentoRichiestaMs).getDate(),
) {
  validaNumeroCifre(numeroCifre);
  validaGiorno(giornoFallback);

  if (!Number.isFinite(momentoRichiestaMs)) {
    throw new TypeError("Il momento della richiesta deve essere un numero finito.");
  }

  impostaNumeroCifre(numeroCifre);

  const pausaSufficiente =
    !stato.modalitaSpecialeUsata &&
    stato.ultimoClickMs !== null &&
    momentoRichiestaMs - stato.ultimoClickMs >= SOGLIA_PAUSA_MS;

  let valore;

  if (pausaSufficiente) {
    const giorno = await ottieniGiornoAffidabile(momentoRichiestaMs, giornoFallback);
    valore = generaSequenzaSpeciale(numeroCifre, giorno);
    stato.modalitaSpecialeUsata = true;
  } else {
    valore = generaSequenzaPuramenteCasuale(numeroCifre);
  }

  stato.ultimoClickMs = momentoRichiestaMs;

  return {
    valore,
    bloccaCambioCifre: false,
  };
}
