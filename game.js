const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const runTimeElement = document.getElementById('runTime');
const signalBars = [...document.querySelectorAll('#signalBars i')];
const signalCopy = document.getElementById('signalCopy');
const statusText = document.getElementById('statusText');
const startOverlay = document.getElementById('startOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const pauseButton = document.getElementById('pauseButton');

let animationId;
let lastFrame = 0;
let elapsed = 0;
let score = 0;
let highScore = Number(localStorage.getItem('neon-drift-high-score') || 0);
let gameState = 'ready';
let player;
let obstacles = [];
let particles = [];
let keys = { left: false, right: false };

highScoreElement.textContent = String(highScore).padStart(6, '0');

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width * ratio;
  canvas.height = bounds.height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (player) player.y = bounds.height - 62;
}

function resetGame() {
  const bounds = canvas.getBoundingClientRect();
  player = { x: bounds.width / 2, y: bounds.height - 62, width: 27, height: 19, speed: 330 };
  obstacles = [];
  particles = [];
  elapsed = 0;
  score = 0;
  scoreElement.textContent = '000000';
  updateTime();
}

function startGame() {
  resetGame();
  gameState = 'running';
  startOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  pauseButton.disabled = false;
  pauseButton.innerHTML = '<span>Ⅱ</span> PAUSE RUN';
  statusText.textContent = 'SIGNAL ACTIVE';
  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (gameState === 'running') {
    gameState = 'paused';
    pauseOverlay.classList.remove('hidden');
    pauseButton.innerHTML = '<span>▶</span> RESUME RUN';
    statusText.textContent = 'SIGNAL PAUSED';
  } else if (gameState === 'paused') {
    gameState = 'running';
    pauseOverlay.classList.add('hidden');
    pauseButton.innerHTML = '<span>Ⅱ</span> PAUSE RUN';
    statusText.textContent = 'SIGNAL ACTIVE';
    lastFrame = performance.now();
    animationId = requestAnimationFrame(gameLoop);
  }
}

function endGame() {
  gameState = 'over';
  highScore = Math.max(highScore, score);
  localStorage.setItem('neon-drift-high-score', highScore);
  highScoreElement.textContent = String(highScore).padStart(6, '0');
  document.getElementById('finalScore').textContent = `SCORE ${String(score).padStart(6, '0')}`;
  gameOverOverlay.classList.remove('hidden');
  pauseButton.disabled = true;
  statusText.textContent = 'SIGNAL LOST';
  signalCopy.textContent = 'OFFLINE';
}

function addObstacle() {
  const bounds = canvas.getBoundingClientRect();
  const size = 16 + Math.random() * 22;
  obstacles.push({ x: 22 + Math.random() * (bounds.width - 44), y: -size, size, speed: 100 + elapsed * 4 + Math.random() * 70, color: Math.random() > .72 ? '#ff6b4a' : '#5fe5dc' });
}

function addParticle(x, y, color, amount = 1) {
  for (let index = 0; index < amount; index += 1) particles.push({ x, y, color, life: .35 + Math.random() * .35, size: 1 + Math.random() * 3, vx: (Math.random() - .5) * 40, vy: Math.random() * 70 });
}

function update(delta) {
  const bounds = canvas.getBoundingClientRect();
  elapsed += delta;
  score = Math.floor(elapsed * 100);
  scoreElement.textContent = String(score).padStart(6, '0');
  updateTime();
  const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  player.x = Math.max(25, Math.min(bounds.width - 25, player.x + direction * player.speed * delta));
  if (Math.random() < delta * (0.9 + elapsed / 22)) addObstacle();
  obstacles.forEach(obstacle => { obstacle.y += obstacle.speed * delta; });
  obstacles = obstacles.filter(obstacle => obstacle.y < bounds.height + 40);
  obstacles.forEach(obstacle => {
    const hit = Math.abs(obstacle.x - player.x) < obstacle.size * .55 + player.width * .4 && Math.abs(obstacle.y - player.y) < obstacle.size * .55 + player.height * .4;
    if (hit) endGame();
  });
  addParticle(player.x, player.y + 10, '#d7f34a');
  particles.forEach(particle => { particle.x += particle.vx * delta; particle.y += particle.vy * delta; particle.life -= delta; });
  particles = particles.filter(particle => particle.life > 0);
  const strength = Math.max(1, 8 - Math.floor(elapsed / 12));
  signalBars.forEach((bar, index) => { bar.style.opacity = index < strength ? '1' : '.16'; });
  signalCopy.textContent = strength > 5 ? 'NOMINAL' : strength > 2 ? 'UNSTABLE' : 'CRITICAL';
}

function draw() {
  const bounds = canvas.getBoundingClientRect();
  context.clearRect(0, 0, bounds.width, bounds.height);
  const background = context.createLinearGradient(0, 0, 0, bounds.height);
  background.addColorStop(0, '#1b2025'); background.addColorStop(1, '#101114');
  context.fillStyle = background; context.fillRect(0, 0, bounds.width, bounds.height);
  context.strokeStyle = 'rgba(215,243,74,.09)'; context.lineWidth = 1;
  for (let x = 0; x < bounds.width; x += 42) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, bounds.height); context.stroke(); }
  for (let y = 0; y < bounds.height; y += 42) { context.beginPath(); context.moveTo(0, y); context.lineTo(bounds.width, y); context.stroke(); }
  obstacles.forEach(obstacle => { context.save(); context.translate(obstacle.x, obstacle.y); context.rotate(elapsed * 2); context.shadowBlur = 16; context.shadowColor = obstacle.color; context.fillStyle = obstacle.color; context.fillRect(-obstacle.size / 2, -obstacle.size / 2, obstacle.size, obstacle.size); context.fillStyle = '#181a1f'; context.fillRect(-obstacle.size / 5, -obstacle.size / 5, obstacle.size * .4, obstacle.size * .4); context.restore(); });
  particles.forEach(particle => { context.globalAlpha = Math.max(0, particle.life * 2); context.fillStyle = particle.color; context.fillRect(particle.x, particle.y, particle.size, particle.size); }); context.globalAlpha = 1;
  if (player) { context.save(); context.translate(player.x, player.y); context.shadowBlur = 22; context.shadowColor = '#d7f34a'; context.fillStyle = '#d7f34a'; context.beginPath(); context.moveTo(0, -13); context.lineTo(18, 9); context.lineTo(0, 5); context.lineTo(-18, 9); context.closePath(); context.fill(); context.fillStyle = '#101114'; context.fillRect(-3, -3, 6, 8); context.restore(); }
}

function updateTime() { const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0'); const seconds = String(Math.floor(elapsed % 60)).padStart(2, '0'); runTimeElement.textContent = `${minutes}:${seconds}`; }
function gameLoop(timestamp) { if (gameState !== 'running') return; const delta = Math.min((timestamp - lastFrame) / 1000, .05); lastFrame = timestamp; update(delta); draw(); animationId = requestAnimationFrame(gameLoop); }

window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keys.left = true; if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keys.right = true; if (event.key.toLowerCase() === 'p') togglePause(); if (event.key === 'Escape') startGame(); });
window.addEventListener('keyup', event => { if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keys.left = false; if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keys.right = false; });
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);
document.getElementById('resumeButton').addEventListener('click', togglePause);
pauseButton.addEventListener('click', togglePause);
resizeCanvas(); resetGame(); draw();
