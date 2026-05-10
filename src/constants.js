export const canvas = document.getElementById('game');
export const ctx    = canvas.getContext('2d');
export const W      = 640;
export const H      = 480;
export const TILE   = 32;
export const COLS   = Math.floor(W / TILE);
export const ROWS   = Math.floor(H / TILE);
