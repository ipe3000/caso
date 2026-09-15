import { generaSequenzaCasuale } from "./random-generator.js";

const DEFAULT_DIGITS = 4;
const MIN_DIGITS = 1;
const MAX_DIGITS = 8;
const ANIMATION_DURATION = 430;

const output = document.querySelector("#number-output");
const button = document.querySelector("#draw-button");
const stage = document.querySelector("#number-stage");
const digitSelector = document.querySelector("#digit-selector");
const digitSelectorLabel = document.querySelector("#digit-selector-label");
const digitPopover = document.querySelector("#digit-options");
const digitOptions = [...digitPopover.querySelectorAll("[data-digits]")];
const resultDigits = document.querySelector("#result-digits");
const rangeMin = document.querySelector("#range-min");
const rangeMax = document.querySelector("#range-max");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let selectedDigits = DEFAULT_DIGITS;

function digitLabel(value) {
  return value === 1 ? "1 cifra" : `${value} cifre`;
}

function renderPlaceholder() {
  output.value = "";
  output.textContent = "--";
  output.classList.add("is-placeholder");
}

function renderNumber(value) {
  output.value = value;
  output.textContent = value;
  output.classList.remove("is-placeholder");
}

function updateDigitUI() {
  const label = digitLabel(selectedDigits);

  digitSelectorLabel.textContent = label;
  resultDigits.textContent = label;
  output.dataset.digits = String(selectedDigits);
  rangeMin.textContent = "0".repeat(selectedDigits);
  rangeMax.textContent = "9".repeat(selectedDigits);

  digitOptions.forEach((option) => {
    option.setAttribute(
      "aria-selected",
      String(Number(option.dataset.digits) === selectedDigits),
    );
  });
}

function setDigits(value) {
  const nextDigits = Number(value);

  if (!Number.isInteger(nextDigits) || nextDigits < MIN_DIGITS || nextDigits > MAX_DIGITS) {
    return;
  }

  selectedDigits = nextDigits;
  updateDigitUI();
  renderPlaceholder();
  closeDigitPopover();
  digitSelector.focus();
}

function openDigitPopover({ focusSelected = false } = {}) {
  digitPopover.hidden = false;
  digitSelector.setAttribute("aria-expanded", "true");

  if (focusSelected) {
    const selected = digitOptions.find(
      (option) => Number(option.dataset.digits) === selectedDigits,
    );
    selected?.focus();
  }
}

function closeDigitPopover() {
  digitPopover.hidden = true;
  digitSelector.setAttribute("aria-expanded", "false");
}

function toggleDigitPopover() {
  if (digitPopover.hidden) {
    openDigitPopover();
  } else {
    closeDigitPopover();
  }
}

function moveOptionFocus(currentIndex, direction) {
  const nextIndex = (currentIndex + direction + digitOptions.length) % digitOptions.length;
  digitOptions[nextIndex].focus();
}

function drawImmediately(value) {
  renderNumber(value);
}

function drawWithMotion(value) {
  button.disabled = true;
  stage.setAttribute("aria-busy", "true");
  output.classList.add("is-rolling");

  window.setTimeout(() => {
    renderNumber(value);
    output.classList.remove("is-rolling");
    stage.removeAttribute("aria-busy");
    button.disabled = false;
  }, ANIMATION_DURATION);
}

function draw() {
  if (button.disabled) return;

  // Una singola richiesta dell'utente corrisponde a una singola estrazione.
  const value = generaSequenzaCasuale(selectedDigits);

  if (reducedMotion.matches) {
    drawImmediately(value);
    return;
  }

  drawWithMotion(value);
}

digitSelector.addEventListener("click", toggleDigitPopover);

digitSelector.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    openDigitPopover({ focusSelected: true });
  }
});

digitOptions.forEach((option, index) => {
  option.addEventListener("click", () => setDigits(option.dataset.digits));

  option.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveOptionFocus(index, 1);
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveOptionFocus(index, -1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      digitOptions[0].focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      digitOptions.at(-1)?.focus();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDigitPopover();
      digitSelector.focus();
    }
  });
});

document.addEventListener("pointerdown", (event) => {
  if (
    !digitPopover.hidden &&
    !digitPopover.contains(event.target) &&
    !digitSelector.contains(event.target)
  ) {
    closeDigitPopover();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !digitPopover.hidden) {
    closeDigitPopover();
    digitSelector.focus();
  }
});

button.addEventListener("click", draw);

updateDigitUI();
renderPlaceholder();
