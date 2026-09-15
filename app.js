import {
  generaProssimaSequenza,
  impostaNumeroCifre,
} from "./random-generator.js";

const DEFAULT_DIGITS = 4;
const MIN_DIGITS = 1;
const MAX_DIGITS = 8;
const GENERATION_DELAY = 520;

const output = document.querySelector("#number-output");
const button = document.querySelector("#draw-button");
const stage = document.querySelector("#number-stage");
const digitOptions = [...document.querySelectorAll("[data-digits]")];
const resultDigits = document.querySelector("#result-digits");
const rangeMin = document.querySelector("#range-min");
const rangeMax = document.querySelector("#range-max");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let selectedDigits = DEFAULT_DIGITS;
let isGenerating = false;

function digitLabel(value) {
  return value === 1 ? "1 cifra" : `${value} cifre`;
}

function renderPlaceholder() {
  output.value = "";
  output.textContent = "--";
  output.classList.add("is-placeholder");
  output.classList.remove("is-revealing");
}

function renderNumber(value) {
  output.value = value;
  output.textContent = value;
  output.classList.remove("is-placeholder");
  output.classList.remove("is-revealing");

  // Riavvia la micro-animazione anche per estrazioni consecutive.
  void output.offsetWidth;
  output.classList.add("is-revealing");
}

function updateDigitUI() {
  resultDigits.textContent = digitLabel(selectedDigits);
  output.dataset.digits = String(selectedDigits);
  rangeMin.textContent = "0".repeat(selectedDigits);
  rangeMax.textContent = "9".repeat(selectedDigits);

  digitOptions.forEach((option) => {
    const isSelected = Number(option.dataset.digits) === selectedDigits;
    option.setAttribute("aria-checked", String(isSelected));
    option.tabIndex = isSelected ? 0 : -1;
  });
}

function updateDigitAvailability() {
  digitOptions.forEach((option) => {
    option.disabled = isGenerating;
  });
}

function setDigits(value, { focus = false } = {}) {
  if (isGenerating) return;

  const nextDigits = Number(value);

  if (!Number.isInteger(nextDigits) || nextDigits < MIN_DIGITS || nextDigits > MAX_DIGITS) {
    return;
  }

  impostaNumeroCifre(nextDigits);
  selectedDigits = nextDigits;
  updateDigitUI();
  renderPlaceholder();

  if (focus) {
    digitOptions.find((option) => Number(option.dataset.digits) === selectedDigits)?.focus();
  }
}

function setGeneratingState(active) {
  isGenerating = active;
  button.disabled = active;
  stage.classList.toggle("is-pending", active);

  if (active) {
    stage.setAttribute("aria-busy", "true");
  } else {
    stage.removeAttribute("aria-busy");
  }

  updateDigitAvailability();
}

async function completeGeneration(momentoClickMs, giornoFallback) {
  try {
    const risultato = await generaProssimaSequenza(
      selectedDigits,
      momentoClickMs,
      giornoFallback,
    );
    renderNumber(risultato.valore);
  } finally {
    setGeneratingState(false);
  }
}

function draw() {
  if (isGenerating) return;

  const momentoClickMs = Date.now();
  const giornoFallback = new Date(momentoClickMs).getDate();
  setGeneratingState(true);

  if (reducedMotion.matches) {
    void completeGeneration(momentoClickMs, giornoFallback);
    return;
  }

  window.setTimeout(
    () => void completeGeneration(momentoClickMs, giornoFallback),
    GENERATION_DELAY,
  );
}

function moveSelection(currentIndex, direction) {
  const nextIndex = (currentIndex + direction + digitOptions.length) % digitOptions.length;
  setDigits(digitOptions[nextIndex].dataset.digits, { focus: true });
}

digitOptions.forEach((option, index) => {
  option.addEventListener("click", () => setDigits(option.dataset.digits));

  option.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(index, 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(index, -1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      setDigits(MIN_DIGITS, { focus: true });
    }

    if (event.key === "End") {
      event.preventDefault();
      setDigits(MAX_DIGITS, { focus: true });
    }
  });
});

button.addEventListener("click", draw);

impostaNumeroCifre(DEFAULT_DIGITS);
updateDigitUI();
updateDigitAvailability();
renderPlaceholder();
