const { spawn, exec } = require('child_process');

const isWin = process.platform === 'win32';
let killing = false;

function killTree(pid) {
  if (isWin) {
    exec(`taskkill /pid ${pid} /T /F`);
  } else {
    try { process.kill(-pid, 'SIGTERM'); } catch (_) {}
  }
}

const opts = { stdio: 'inherit', shell: true };

const dev    = spawn('npm', ['run', 'dev'],    opts);
const editor = spawn('npm', ['run', 'editor'], opts);

function shutdown() {
  if (killing) return;
  killing = true;
  killTree(dev.pid);
  killTree(editor.pid);
}

dev.on('exit',    shutdown);
editor.on('exit', shutdown);

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);
