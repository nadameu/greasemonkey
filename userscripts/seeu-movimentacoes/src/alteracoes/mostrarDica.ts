import { h } from '@nadameu/create-element';
import classNames from './telaMovimentacoes.module.scss';

let dica: HTMLDivElement | null = null;
function criarDica() {
  return document.body.appendChild(
    h('div', { hidden: true, className: classNames.dica! })
  );
}
export function mostrarDica(html: string) {
  if (!dica) {
    dica = criarDica();
  }
  dica.innerHTML = html;
  dica.hidden = false;
}
const distanciaDoMouse = 16;
const margemBorda = 2 * distanciaDoMouse;
const intervalMs = 16;
let lastTime = Date.now();
let lastE: MouseEvent;
let timer: number | null = null;
export function moverDica(e: MouseEvent) {
  lastE = e;
  const curTime = Date.now();
  if (curTime < lastTime + intervalMs) {
    if (timer === null) {
      timer = window.setTimeout(() => {
        timer = null;
        moverDica(lastE);
      }, intervalMs);
    }
    return;
  }
  lastTime = curTime;
  let x = e.clientX;
  let y = e.clientY;
  const { width, height } = dica!.getBoundingClientRect();
  const { width: docWidth, height: docHeight } =
    document.documentElement.getBoundingClientRect();
  if (x + distanciaDoMouse + width > docWidth - margemBorda) {
    x -= distanciaDoMouse + width - window.scrollX;
  } else {
    x += distanciaDoMouse + window.scrollX;
  }
  if (y + distanciaDoMouse + height > docHeight - margemBorda) {
    y -= distanciaDoMouse + height - window.scrollY;
  } else {
    y += distanciaDoMouse + window.scrollY;
  }
  dica!.style.left = `${x}px`;
  dica!.style.top = `${y}px`;
}
export function esconderDica() {
  dica!.hidden = true;
}
