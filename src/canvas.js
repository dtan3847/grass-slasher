import { W, H, SCALE } from './geometry.js';

export let canvas = null;
export let ctx    = null;

export function bootCanvas() {
  canvas        = document.getElementById('game');
  ctx           = canvas.getContext('2d');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
}
