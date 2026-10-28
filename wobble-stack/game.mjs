import { assessStack, advanceSlider } from './rules.mjs';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['score', 'best', 'message', 'hint', 'pause', 'overlay', 'eyebrow', 'title', 'description', 'result', 'action', 'actionHint'].map(id => [id, document.getElementById(id)]));
const colors = ['#ff987f', '#fff052', '#52efbc', '#9a6af6', '#6fc5ff'];
const W = 420, H = 760, BW = 142, BH = 44, FLOOR = 620;
const platform = { x: 210, y: FLOOR, w: 248 };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let best = 0;
try { best = Math.max(0, Math.floor(Number(localStorage.getItem('wobble-stack-best-v1')) || 0)); if (!Number.isFinite(best)) best = 0; } catch { /* Private/restricted storage: keep best for this session. */ }
// Native storage supplements browser storage in the offline iOS build.
const nativeBest = window.wobbleNative?.bestScore;
if (Number.isSafeInteger(nativeBest) && nativeBest >= 0) best = Math.max(best, nativeBest);
let state, beforePause, blocks, active, score, risk, timer, camera, particles, toast, toastTime, clock = 0, last = 0;
let scale = 1, offsetX = 0, offsetY = 0;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  scale = Math.min(rect.width / W, rect.height / H);
  offsetX = (rect.width - W * scale) / 2;
  offsetY = (rect.height - H * scale) / 2;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

function newBlock() {
  const top = blocks.length ? blocks.at(-1).y : FLOOR;
  active = { x: score % 2 ? 338 : 82, y: top - 164, w: BW, h: BH, color: colors[score % colors.length], direction: score % 2 ? -1 : 1, vy: 0, age: 0, angle: 0 };
}
function reset() {
  score = 0; risk = 0; timer = 0; camera = 0; blocks = []; particles = []; toast = ''; toastTime = 0;
  state = 'ready'; beforePause = null; newBlock();
  ui.score.value = '0'; ui.best.textContent = `BEST ${best}`; ui.overlay.hidden = true;
  ui.pause.textContent = 'Ⅱ'; ui.pause.setAttribute('aria-label', 'Pause game');
  setMessage('Tap to drop.', 'or press Space');
  syncState();
}
function setMessage(text, hint = 'tap / Space to drop') { ui.message.textContent = text; ui.hint.textContent = window.wobbleNative ? 'tap anywhere' : hint; }
function syncState() {
  document.querySelector('.game').dataset.state = state;
  canvas.setAttribute('aria-label', `Score ${score}. ${state === 'ready' || state === 'sliding' ? 'Tap or press Space to drop the sliding jelly block.' : state === 'paused' ? 'Paused.' : state === 'over' ? 'Tower fell. Tap to retry.' : 'Block in motion.'}`);
}
function interact() {
  if (state === 'paused') return resume();
  if (state === 'over') { reset(); return; }
  if (state === 'ready' || state === 'sliding') drop();
}
function drop() {
  state = 'falling'; active.vy = 0; active.age = 0; setMessage('Here it comes…'); syncState();
}
function pause() {
  if (state === 'paused' || state === 'over') return;
  beforePause = state; state = 'paused';
  ui.eyebrow.textContent = 'JELLY BREAK'; ui.title.textContent = 'Hold that wobble.';
  ui.description.textContent = 'Your tower is right where you left it.';
  ui.result.innerHTML = `${score}<small>BLOCKS STACKED</small>`;
  ui.action.innerHTML = 'Keep stacking <span>↗</span>'; ui.actionHint.textContent = 'Tap anywhere or press Space';
  ui.overlay.hidden = false; ui.pause.textContent = '▶'; ui.pause.setAttribute('aria-label', 'Resume game'); syncState();
}
function resume() {
  state = beforePause || 'ready'; beforePause = null; last = performance.now();
  ui.overlay.hidden = true; ui.pause.textContent = 'Ⅱ'; ui.pause.setAttribute('aria-label', 'Pause game'); syncState();
}
function burst(x, y, color, count = 12) {
  if (reducedMotion) return;
  for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 220, vy: -70 - Math.random() * 160, life: .7, color, r: 2 + Math.random() * 4 });
}
function collapse(reason) {
  state = 'tumbling'; timer = 0; toast = reason; setMessage('Whoops. Jelly happens.', 'a soft landing, eventually');
  const direction = active.x < (blocks.at(-1)?.x || 210) ? -1 : 1;
  blocks.push(active); active = null;
  blocks.forEach((b, i) => { b.vx = direction * (30 + i * 8) + (Math.random() - .5) * 80; b.vy = -40 - Math.random() * 110; b.spin = direction * (.5 + Math.random() * 1.8); });
  syncState();
}
function gameOver() {
  state = 'over';
  ui.eyebrow.textContent = score > 0 && score === best ? 'ROOFTOP RECORD' : 'SHIFT REPORT';
  ui.title.textContent = 'Jelly down!'; ui.description.textContent = toast;
  ui.result.innerHTML = `${score}<small>BLOCK${score === 1 ? '' : 'S'} STACKED · BEST ${best}</small>`;
  ui.action.innerHTML = 'Stack again <span>↗</span>'; ui.actionHint.textContent = 'Tap anywhere or press Space';
  ui.overlay.hidden = false; syncState();
}
function land() {
  const below = blocks.at(-1) || platform;
  const overlap = Math.min(active.x + BW / 2, below.x + below.w / 2) - Math.max(active.x - BW / 2, below.x - below.w / 2);
  if (overlap <= 0) return collapse('That one missed the tower. Try the middle!');
  const result = assessStack([...blocks, active], platform);
  if (!result.stable) return collapse('A little too far over the edge. Aim for balance!');
  active.y = below.y - BH; active.age = 0; blocks.push(active); active = null;
  risk = result.risk; state = 'settling'; timer = 0;
  const offset = Math.abs(blocks.at(-1).x - below.x);
  toast = offset < 10 ? 'Sweet spot!' : risk > .72 ? 'Easy does it…' : 'Nicely stacked.'; toastTime = 1;
  burst(blocks.at(-1).x, blocks.at(-1).y, blocks.at(-1).color, offset < 10 ? 12 : 5);
  syncState();
}

// Fixed simulation steps make falling/collision independent of render frequency.
function update(dt) {
  if (state === 'paused' || state === 'over') return;
  clock += dt;
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 450 * dt; }
  if (toastTime > 0) toastTime -= dt;
  if (state === 'ready' || state === 'sliding') {
    Object.assign(active, advanceSlider(active.x, active.direction, Math.min(190, 108 + score * 4), dt, 82, 338));
  } else if (state === 'falling') {
    active.vy += 1200 * dt; active.y += active.vy * dt;
    const targetY = (blocks.at(-1)?.y ?? FLOOR) - BH;
    if (active.y >= targetY) { active.y = targetY; land(); }
  } else if (state === 'settling') {
    timer += dt;
    if (timer >= .32) {
      score++; ui.score.value = String(score);
      if (score > best) { best = score; ui.best.textContent = `BEST ${best}`;
        try { window.wobbleNative?.saveBestScore(best); } catch { /* Browser/session storage remains available. */ }
        try { localStorage.setItem('wobble-stack-best-v1', String(best)); } catch { /* Session best still works. */ } }
      state = 'sliding'; newBlock(); setMessage(toast); syncState();
    }
  } else if (state === 'tumbling') {
    timer += dt;
    for (const b of blocks) { b.vy += 650 * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.angle += b.spin * dt; }
    if (timer >= (reducedMotion ? .32 : .8)) gameOver();
  }
  const topY = blocks.at(-1)?.y ?? FLOOR;
  if (state !== 'tumbling') camera += (Math.max(0, 390 - topY) - camera) * (1 - Math.exp(-7 * dt));
  blocks.forEach(b => { b.age += dt; });
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function jelly(b, index, moving = false) {
  const settleAge = b.age || 0;
  const squash = !moving && settleAge < .38 ? Math.sin(settleAge / .38 * Math.PI * 2) * .14 * Math.exp(-settleAge * 5) : 0;
  const sway = !reducedMotion && state !== 'tumbling' && !moving ? Math.sin(clock * 3 + index * .36) * risk * (index + 1) * .65 : 0;
  const angle = state === 'tumbling' ? b.angle : moving ? 0 : Math.sin(clock * 3 + index * .36) * risk * .018;
  ctx.save(); ctx.translate(b.x + sway, b.y + BH / 2 + camera); ctx.rotate(angle); ctx.scale(1 + squash, 1 - squash);
  ctx.shadowColor = '#53327533'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8;
  roundRect(-b.w / 2, -BH / 2, b.w, BH, 13); ctx.fillStyle = b.color; ctx.fill();
  ctx.shadowColor = 'transparent';
  const shade = ctx.createLinearGradient(0, -BH / 2, 0, BH / 2); shade.addColorStop(0, '#ffffff30'); shade.addColorStop(.5, '#ffffff00'); shade.addColorStop(1, '#34226a26');
  ctx.fillStyle = shade; ctx.fill();
  roundRect(-b.w / 2 + 7, -BH / 2 + 5, b.w - 14, BH - 12, 9); ctx.strokeStyle = '#ffffff35'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-b.w / 2 + 13, 5); ctx.lineTo(-b.w / 2 + 13, -7); ctx.quadraticCurveTo(-b.w / 2 + 13, -13, -b.w / 2 + 22, -13); ctx.lineTo(b.w / 2 - 24, -13); ctx.strokeStyle = '#ffffff35'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
}
function draw() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cw = canvas.width / dpr, ch = canvas.height / dpr;
  const bg = ctx.createLinearGradient(0, 0, cw, ch); bg.addColorStop(0, '#d0c0f4'); bg.addColorStop(.5, '#c5b2ee'); bg.addColorStop(1, '#b9a4e3');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
  ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
  // Quiet rooftop details stay behind the playable geometry.
  ctx.fillStyle = '#ffffff0d';
  for (let i = 0; i < 6; i++) { const y = ((i * 151 + camera * .25) % 850) - 70; roundRect(i % 2 ? 305 : -35, y, 150, 21, 12); ctx.fill(); }
  ctx.fillStyle = '#76629a13';
  for (let i = 0; i < 8; i++) { const height = 30 + i % 3 * 18; roundRect(i * 61 - 20, FLOOR + 28 + camera * .5, 47, height, 5); ctx.fill(); }
  ctx.save(); ctx.translate(0, camera);
  ctx.shadowColor = '#42265b40'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 8;
  roundRect(86, FLOOR, 248, 19, 10); const p = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 19); p.addColorStop(0, '#67518f'); p.addColorStop(1, '#49356e'); ctx.fillStyle = p; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = '#ffffff28'; roundRect(99, FLOOR + 2, 222, 3, 2); ctx.fill();
  ctx.restore();
  if (active && (state === 'ready' || state === 'sliding')) {
    const below = blocks.at(-1) || platform;
    ctx.save(); ctx.setLineDash([4, 8]); ctx.strokeStyle = '#ffffff75'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(active.x, active.y + BH + 13 + camera); ctx.lineTo(active.x, below.y - 12 + camera); ctx.stroke(); ctx.restore();
    const y = active.y + 22 + camera;
    ctx.font = '26px system-ui'; ctx.fillStyle = '#67518f66'; ctx.textAlign = 'center'; ctx.fillText('‹', active.x - 91, y + 8); ctx.fillText('›', active.x + 91, y + 8);
  }
  blocks.forEach((b, i) => jelly(b, i));
  if (active) jelly(active, blocks.length, true);
  for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / .7); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y + camera, p.r, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
  if (state !== 'ready' && state !== 'over' && state !== 'paused' && state !== 'tumbling' && score > 0) {
    ctx.font = '800 9px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#65508399'; ctx.fillText(risk > .72 ? 'A LITTLE WOBBLY' : 'LOOKING SWEET', 210, 724);
  }
}
let accumulator = 0;
function frame(now) {
  if (!last) last = now;
  const elapsed = Math.min((now - last) / 1000, .1); last = now;
  if (state !== 'paused' && !document.hidden) {
    accumulator += elapsed;
    while (accumulator >= 1 / 120) { update(1 / 120); accumulator -= 1 / 120; }
  } else accumulator = 0;
  draw(); requestAnimationFrame(frame);
}
document.querySelector('.game').addEventListener('pointerdown', event => {
  if (event.target.closest('#pause, #action') || !event.isPrimary || event.button !== 0) return;
  event.preventDefault(); interact();
});
ui.pause.addEventListener('click', () => state === 'paused' ? resume() : pause());
ui.action.addEventListener('click', interact);
document.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault(); if (!event.repeat && event.target.tagName !== 'BUTTON') interact();
    // Native button Space activation is prevented, so explicitly activate once.
    else if (!event.repeat) event.target.click();
  }
  if ((event.code === 'KeyP' || event.code === 'Escape') && !event.repeat) state === 'paused' ? resume() : pause();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); last = performance.now(); accumulator = 0; });
window.addEventListener('blur', () => pause());
window.addEventListener('wobble-native-pause', () => pause());
reset(); resize(); requestAnimationFrame(frame);
