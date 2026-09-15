import { generaNumeroCasuale } from "./random-generator.js";

const MIN = 1;
const MAX = 100;
const ANIMATION_DURATION = 430;

const output = document.querySelector("#number-output");
const button = document.querySelector("#draw-button");
const stage = document.querySelector("#number-stage");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function renderNumber(value) {
  const testo = String(value);
  output.value = testo;
  output.textContent = testo;
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
  const value = generaNumeroCasuale(MIN, MAX);

  if (reducedMotion.matches) {
    drawImmediately(value);
    return;
  }

  drawWithMotion(value);
}

button.addEventListener("click", draw);
