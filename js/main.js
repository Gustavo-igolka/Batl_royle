import { K, B } from './data/balance.js';
import { CHARS } from './data/characters.js';
import { ABIL } from './abilities.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 960, H = 540, DT = 1 / 50;
const keys = {}, m = { x: W / 2, y: H / 2, down: false };
const CARDS = [
  { id: 'fire', n: 'Огонь', t: '+5 урона' }, { id: 'water', n: 'Вода', t: '+2 HP за попадание' },
  { id: 'stone', n: 'Камень', t: 'отталкивание +5' }, { id: 'elec', n: 'Электричество', t: '+2 к скорости' }];
const COL = { red: '#e02222', blue: '#1e78e6', green: '#9ad23a', yellow: '#ffd21a' };
const cardBox = i => ({ x: 80 + i * 200, y: 170, w: 180, h: 200 });
const LEAVES = []; for (let i = 0, s = 7; i < 46; i++) { s = (s * 9301 + 49297) % 233280; const a = s / 233280; s = (s * 9301 + 49297) % 233280; LEAVES.push([a * W, s / 233280 * H, (i % 3) * 0.3 - 0.4]); }
let S, view = null, rebind = null, CH = 'vladimir';
const DEF = { music: 0.6, sfx: 0.6, pauseCards: true, keys: { up: 'KeyW', left: 'KeyA', down: 'KeyS', right: 'KeyD', a1: 'KeyE', a2: 'KeyQ' } };
let cfg = { ...DEF, keys: { ...DEF.keys } }; try { const o = JSON.parse(localStorage.getItem('ui_cfg')); if (o) cfg = { ...DEF, ...o, keys: { ...DEF.keys, ...o.keys } }; } catch (e) {}
const save = () => { try { localStorage.setItem('ui_cfg', JSON.stringify(cfg)); } catch (e) {} };
let ac; function beep(f, d = 0.06) { if (!cfg.sfx) return; try { ac = ac || new AudioContext(); const o = ac.createOscillator(), v = ac.createGain(); o.frequency.value = f; v.gain.value = 0.15 * cfg.sfx; o.connect(v); v.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {} }
const kn = c => c.replace('Key', '').replace('Digit', '').replace('Space', 'Пробел');
const rnd = (a, b) => a + Math.random() * (b - a), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function start() {
  S = { t: 0, ch: CHARS[CH], p: { x: W / 2, y: H / 2, hp: CHARS[CH].hp, iv: 0, cd: { main: 0, a1: 0, a2: 0 }, swing: 0, coffee: 0, face: 0 },
    en: Object.keys(B.enemies).map(t => spawn({ t, sh: B.enemies[t].shot ? B.enemies[t].shot.every : 0 })), bul: [], shots: [], pul: [], min: [], mCd: 0, mOn: false,
    items: [], kills: 0, el: null, card: false, nextCard: B.cards.first, rush: null, over: null, bite: 0,
    cool: 0, combo: 0, cT: 0, med: B.medkit.every, cof: B.coffee.every, pT: B.pule.every };
}
function spawn(e) {
  const d = B.enemies[e.t], s = Math.floor(Math.random() * 4), r = Math.random();
  e.x = s < 2 ? r * W : (s === 2 ? -50 : W + 50); e.y = s < 2 ? (s ? H + 50 : -50) : r * H;
  e.hp = d.hp; e.alive = true; e.rt = 0; return e;
}
function cool(n) { S.cool = Math.max(0, Math.min(B.rank.max, S.cool + n)); }
function pick(i) { S.el = CARDS[i].id; S.card = false; cool(B.rank.card[CARDS[i].id]); }
addEventListener('keydown', e => {
  if (rebind) { if (e.code !== 'Escape') { cfg.keys[rebind] = e.code; save(); } rebind = null; e.preventDefault(); return; }
  keys[e.code] = true;
  if (e.code === 'Escape') { view = view ? null : 'settings'; return; }
  if (view) return;
  if (e.code === 'Space') e.preventDefault();
  if (S.card && /^Digit[1-4]$/.test(e.code)) pick(+e.code[5] - 1);
  if (S.over && (e.code === 'KeyR' || e.code === 'Enter')) start();
  if (!S.over && !S.card) { if (e.code === cfg.keys.a1) use('a1'); if (e.code === cfg.keys.a2) use('a2'); }
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('mouseup', () => m.down = false);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); m.x = (e.clientX - r.left) * W / r.width; m.y = (e.clientY - r.top) * H / r.height; });
cv.addEventListener('mousedown', e => {
  if (view) { clickSettings(); return; }
  if (S.over === 'menu' && m.x > W / 2 - 90 && m.x < W / 2 + 90 && m.y > 360 && m.y < 400) { view = 'settings'; return; }
  if (S.over) { start(); return; }
  if (S.card) { CARDS.forEach((c, i) => { const b = cardBox(i); if (m.x > b.x && m.x < b.x + b.w && m.y > b.y && m.y < b.y + b.h) pick(i); }); return; }
  if (e.button === 0) m.down = true;
});

const dmgOf = (arr, res) => ((res === 1 || res === 3) ? arr[1] : arr[0]) + (S.el === 'fire' ? B.cards.fire : 0);
function heal(n) { S.p.hp = Math.min(B.player.maxHp, S.p.hp + n); }
function hurt(n) { const p = S.p; if (p.iv > 0) return; p.hp -= n; p.iv = B.player.iframes; cool(-B.rank.hurt); beep(120, 0.1); }
function hit(e, arr, kb, ux, uy) {
  const d = B.enemies[e.t]; e.hp -= dmgOf(arr, d.res);
  if (S.el === 'water') heal(B.cards.water);
  const k = (kb + (S.el === 'stone' ? B.cards.stone : 0)) * 2 * (d.res >= 2 ? 0.5 : 1); e.x += ux * k; e.y += uy * k;
  beep(260, 0.03);
  if (e.hp <= 0) { e.alive = false; e.rt = B.respawn; S.kills++; cool(B.rank.kill[e.t]); if (!S.combo) S.cT = B.rank.comboTime; S.combo++; beep(520); }
}
function nearest(o) { let b = null, bd = 1e9; for (const e of S.en) if (e.alive) { const d = dist(o, e); if (d < bd) { bd = d; b = e; } } return b; }
const ctx = { get S() { return S; }, hit, dist };
function use(slot) { // универсально для любого бойца: слот -> способность по id
  const p = S.p, a = ABIL[S.ch[slot].id]; if (p.cd[slot] > 0) return;
  if (a.use(ctx) === false) return;
  p.cd[slot] = a.cd; if (slot !== 'main') cool(B.rank[slot]);
}
function newPules() {
  const n = 1 + Math.floor(Math.random() * 6), p = S.p;
  for (let i = 0; i < n; i++) {
    const a = ((i + Math.random() * 0.5) / 6) * 6.283, x = W / 2 + Math.cos(a) * 620, y = H / 2 + Math.sin(a) * 420;
    const to = Math.random() < B.pule.aim ? p : { x: rnd(100, W - 100), y: rnd(80, H - 80) };
    S.pul.push({ x, y, sx: x, sy: y, a: Math.atan2(to.y - y, to.x - x), n: i + 1 });
  }
}
function update() {
  const p = S.p; if (S.over || view || (S.card && cfg.pauseCards)) return;
  S.t += DT; p.iv -= DT; p.swing -= DT; p.coffee -= DT; S.bite -= DT;
  for (const k in p.cd) { const a = ABIL[S.ch[k].id]; if (a.busy && a.busy(ctx)) p.cd[k] = a.cd; else p.cd[k] -= DT; }
  cool(-B.rank.decay * DT); if (S.combo && (S.cT -= DT) <= 0) { cool(S.combo); S.combo = 0; }
  const K2 = cfg.keys; let dx = (keys[K2.right] ? 1 : 0) - (keys[K2.left] ? 1 : 0), dy = (keys[K2.down] ? 1 : 0) - (keys[K2.up] ? 1 : 0);
  const l = Math.hypot(dx, dy) || 1;
  const sp = (S.ch.speed + (S.el === 'elec' ? B.cards.elec : 0) + (p.coffee > 0 ? B.coffee.speed + B.passive.coffeeBonus : 0)) * K;
  p.x = Math.max(20, Math.min(W - 20, p.x + dx / l * sp * DT)); p.y = Math.max(20, Math.min(H - 20, p.y + dy / l * sp * DT));
  p.face = Math.atan2(m.y - p.y, m.x - p.x);
  if (m.down) use('main');
  for (const b of S.bul) {
    b.x += b.vx * B.ak.speed * DT; b.y += b.vy * B.ak.speed * DT; b.life -= DT;
    for (const e of S.en) if (e.alive && b.life > 0 && dist(e, b) < B.enemies[e.t].r * B.hit + 5) { b.life = 0; hit(e, B.ak.dmg, B.ak.kb, b.vx, b.vy); heal(B.ak.heal); }
    for (const q of S.pul) if (b.life > 0 && dist(q, b) < 25) { b.life = 0; q.x = q.sx; q.y = q.sy; }
  }
  S.bul = S.bul.filter(b => b.life > 0);
  for (const e of S.en) {
    if (!e.alive) { if ((e.rt -= DT) <= 0) spawn(e); continue; }
    const d = B.enemies[e.t], a = Math.atan2(p.y - e.y, p.x - e.x), w = e.t === 'green' ? Math.sin(S.t * 4) * 0.7 : 0, v = d.speed * K * DT;
    e.x += Math.cos(a + w) * v; e.y += Math.sin(a + w) * v;
    if (dist(e, p) < (d.r + B.player.r) * B.hit) hurt(d.contact);
    if (d.shot && (e.sh -= DT) <= 0) { e.sh = d.shot.every; S.shots.push({ x: e.x, y: e.y, a, t: 0 }); }
  }
  const sh = B.enemies.yellow.shot;
  for (const s of S.shots) {
    s.t += DT; if (s.t > sh.turnAt) { const da = Math.atan2(Math.sin(Math.atan2(p.y - s.y, p.x - s.x) - s.a), Math.cos(Math.atan2(p.y - s.y, p.x - s.x) - s.a)); s.a += Math.max(-2.5 * DT, Math.min(2.5 * DT, da)); }
    s.x += Math.cos(s.a) * sh.speed * K * DT; s.y += Math.sin(s.a) * sh.speed * K * DT;
    if (dist(s, p) < 18 * B.hit + B.player.r * B.hit) { hurt(sh.dmg); s.t = 99; }
  }
  S.shots = S.shots.filter(s => s.t < sh.life);
  if (!S.pul.length && (S.pT -= DT) <= 0) { S.pT = B.pule.every; newPules(); }
  for (const q of S.pul) { q.x += Math.cos(q.a) * B.pule.speed * K * DT; q.y += Math.sin(q.a) * B.pule.speed * K * DT; if (dist(q, p) < 18 + B.player.r * B.hit) hurt(B.pule.contact); }
  S.pul = S.pul.filter(q => q.x > -150 && q.x < W + 150 && q.y > -150 && q.y < H + 150);
  for (const mi of S.min) {
    const t = nearest(mi) || p, a = Math.atan2(t.y - mi.y, t.x - mi.x); mi.x += Math.cos(a) * B.minion.speed * K * DT; mi.y += Math.sin(a) * B.minion.speed * K * DT;
    if (t !== p && dist(mi, t) < B.enemies[t.t].r + B.minion.r) { hit(t, B.minion.dmg, 3, Math.cos(a), Math.sin(a)); heal(B.minion.heal); mi.dead = true; }
  }
  S.min = S.min.filter(x => !x.dead);
  if ((S.med -= DT) <= 0) { S.med = B.medkit.every; S.items.push({ k: 'med', x: rnd(60, W - 60), y: rnd(60, H - 60) }); }
  if ((S.cof -= DT) <= 0) { S.cof = B.coffee.every; S.items.push({ k: 'cof', x: rnd(60, W - 60), y: rnd(60, H - 60) }); }
  S.items = S.items.filter(i => {
    if (dist(i, p) > 34) return true;
    cool(B.rank.item); beep(660); if (i.k === 'med') heal(B.medkit.heal + B.passive.medkitBonus); else p.coffee = B.coffee.time; return false;
  });
  if (S.t >= S.nextCard) { S.card = true; S.nextCard = S.t + B.cards.every; }
  if (!S.rush && (p.hp < B.rush.hp || S.kills >= B.rush.kills)) { S.rush = B.rush.time; S.bite = 0.35; }
  if (S.rush) { S.rush -= DT; if (S.rush <= 0) S.over = 'win'; }
  if (p.hp <= 0) S.over = 'lose';
}
const txt = (s, x, y, sz = 20, c = '#fff', al = 'left', ol) => { g.font = `bold ${sz}px sans-serif`; g.textAlign = al; if (ol) { g.lineWidth = 4; g.strokeStyle = ol; g.strokeText(s, x, y); } g.fillStyle = c; g.fillText(s, x, y); };
function tag(x, y, a, w, h, col, n) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#000'; g.strokeStyle = col; g.lineWidth = 3; g.fillRect(-w / 2, -h / 2, w, h); g.strokeRect(-w / 2, -h / 2, w, h); if (n) txt(n, 0, 6, 16, col, 'center'); else { g.fillStyle = col; g.beginPath(); g.moveTo(w / 2 - 4, 0); g.lineTo(0, -h / 2 + 4); g.lineTo(0, h / 2 - 4); g.fill(); } g.restore(); }
function scribble(e, d) {
  g.fillStyle = '#000'; g.beginPath(); g.arc(e.x, e.y, d.r, 0, 7); g.fill(); g.strokeStyle = COL[e.t]; g.lineWidth = 3; g.beginPath();
  if (e.t === 'blue') { g.setLineDash([9, 7]); g.arc(e.x, e.y, d.r * 0.65, 0, 6); } else if (e.t === 'red') { for (let i = -2; i <= 2; i++) { g.moveTo(e.x + i * 7, e.y - d.r * 0.6); g.bezierCurveTo(e.x + i * 7 + 8, e.y - 6, e.x + i * 7 - 8, e.y + 6, e.x + i * 7, e.y + d.r * 0.6); } }
  else if (e.t === 'green') { g.moveTo(e.x - 14, e.y - 12); g.lineTo(e.x, e.y + 10); g.lineTo(e.x + 4, e.y - 14); g.lineTo(e.x + 16, e.y + 10); } else { g.moveTo(e.x - 12, e.y); g.lineTo(e.x + 12, e.y); g.moveTo(e.x, e.y - 12); g.lineTo(e.x, e.y + 12); }
  g.stroke(); g.setLineDash([]);
}
function draw() {
  const p = S.p; g.fillStyle = '#0b8a0b'; g.fillRect(0, 0, W, H);
  for (const [x, y, r] of LEAVES) { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = '#9ad23a'; g.beginPath(); g.ellipse(0, 0, 13, 24, 0, 0, 7); g.fill(); g.strokeStyle = '#4c9a1c'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -20); g.lineTo(0, 22); g.stroke(); g.restore(); }
  for (const i of S.items) { g.fillStyle = i.k === 'med' ? '#b6e04a' : '#6b3f1d'; g.fillRect(i.x - 18, i.y - 18, 36, 36); txt(i.k === 'med' ? '+' : '☕', i.x, i.y + 10, 28, i.k === 'med' ? '#fff' : '#fff', 'center'); }
  for (const e of S.en) if (e.alive) { const d = B.enemies[e.t]; scribble(e, d); txt(Math.ceil(e.hp), e.x, e.y + 7 + (e.t === 'yellow' ? 0 : 0), 20, '#f33', 'center', '#000'); }
  for (const q of S.pul) tag(q.x, q.y, q.a, B.pule.w, B.pule.h, '#e22', q.n);
  for (const s of S.shots) tag(s.x, s.y, s.a, 36, 20, '#ffd21a');
  for (const mi of S.min) { g.fillStyle = '#eee'; g.beginPath(); g.arc(mi.x, mi.y, B.minion.r, 0, 7); g.fill(); g.fillStyle = '#999'; g.fillRect(mi.x - 4, mi.y + 4, 8, 12); }
  g.fillStyle = '#111'; for (const b of S.bul) { g.beginPath(); g.arc(b.x, b.y, 6, 0, 7); g.fill(); }
  g.globalAlpha = p.iv > 0 && Math.floor(S.t * 20) % 2 ? 0.4 : 1;
  g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(p.x, p.y, B.player.r, 0, 7); g.fill(); g.fillStyle = '#e8a33a'; g.beginPath(); g.arc(p.x, p.y, B.player.r - 6, 0, 7); g.fill();
  g.fillStyle = '#d22'; g.save(); g.translate(p.x, p.y); g.rotate(p.face); g.beginPath(); g.moveTo(B.player.r + 14, 0); g.lineTo(B.player.r + 2, -8); g.lineTo(B.player.r + 2, 8); g.fill(); g.restore(); g.globalAlpha = 1;
  if (p.swing > 0) { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(p.x, p.y); g.arc(p.x, p.y, B.knife.range, p.face - B.knife.arc / 2, p.face + B.knife.arc / 2); g.fill(); }
  txt(Math.ceil(p.hp), 20, 62, 60, '#f22', 'left', '#600'); if (S.el) txt(CARDS.find(c => c.id === S.el).n, 110, 40, 18, '#fff', 'left', '#063');
  txt(S.kills, W - 20, 62, 60, '#f22', 'right', '#600');
  const ri = B.rank.at.reduce((a, t, i) => S.cool >= t ? i : a, 0);
  txt(B.rank.letters[ri], W - 185, 74, 76, ['#789', '#8a8', '#6c6', '#3b3', '#fc3', '#f93', '#f33', '#c3f'][ri], 'center', '#000'); txt(Math.floor(S.cool), W - 185, 98, 18, '#000', 'center');
  [['main', 'ЛКМ'], ['a1', kn(cfg.keys.a1)], ['a2', kn(cfg.keys.a2)]].forEach(([sl, k], i) => { const a = ABIL[S.ch[sl].id], cd = a.busy && a.busy(ctx) ? 99 : p.cd[sl], x = W - 230 + i * 74, y = H - 78; g.fillStyle = cd > 0 ? 'rgba(0,40,0,.55)' : 'rgba(0,70,0,.8)'; g.fillRect(x, y, 66, 62); txt(k, x + 33, y + 22, 16, '#fff', 'center'); txt(cd > 0 ? (cd > 50 ? '✕' : cd.toFixed(1)) : a.name, x + 33, y + 48, 15, cd > 0 ? '#faa' : '#cfc', 'center'); });
  if (S.rush > 0) txt(Math.ceil(S.rush), W / 2, 50, 40, '#b00', 'center', '#fff');
  if (S.bite > 0) { g.fillStyle = 'rgba(200,0,0,.45)'; g.fillRect(0, 0, W, H); txt('УКУС', W / 2, H / 2, 80, '#fff', 'center'); }
  if (S.card) {
    g.fillStyle = 'rgba(14,27,24,.85)'; g.fillRect(0, 0, W, H); txt('Выбери способность (1–4)', W / 2, 130, 28, '#fff', 'center');
    CARDS.forEach((c, i) => { const b = cardBox(i); g.fillStyle = '#1d3a33'; g.fillRect(b.x, b.y, b.w, b.h); txt(`${i + 1}`, b.x + 12, b.y + 28, 20, '#7be236');
      txt(c.n, b.x + b.w / 2, b.y + 110, 22, '#fff', 'center'); txt(c.t, b.x + b.w / 2, b.y + 145, 14, '#bcd', 'center'); });
  }
  if (S.over) {
    g.fillStyle = 'rgba(14,27,24,.88)'; g.fillRect(0, 0, W, H);
    if (S.over === 'menu') { txt('Último Impulso', W / 2, 220, 56, '#7be236', 'center'); txt('WASD — движение · мышь — прицел · ЛКМ — атака · E / Q — способности', W / 2, 280, 17, '#fff', 'center'); txt('Клик, чтобы играть', W / 2, 330, 22, '#fff', 'center'); g.strokeStyle = '#7be236'; g.lineWidth = 2; g.strokeRect(W / 2 - 90, 360, 180, 40); txt('Настройки (Esc)', W / 2, 387, 18, '#fff', 'center'); }
    else { txt(S.over === 'win' ? 'Вы успешно сбежали' : 'Вы погибли', W / 2, 240, 52, '#fff', 'center'); txt(`Убийств: ${S.kills} · клик или R — заново`, W / 2, 300, 22, '#bcd', 'center'); }
  }
  if (view) drawSettings();
}
const KEYROWS = [['up', 'Вверх'], ['left', 'Влево'], ['down', 'Вниз'], ['right', 'Вправо'], ['a1', 'Первая способность'], ['a2', 'Вторая способность']];
function srows() {
  const r = [
    { l: 'Музыка', v: Math.round(cfg.music * 10) * 10 + '%', f: d => cfg.music = Math.max(0, Math.min(1, cfg.music + d * 0.1)) },
    { l: 'Эффекты', v: Math.round(cfg.sfx * 10) * 10 + '%', f: d => cfg.sfx = Math.max(0, Math.min(1, cfg.sfx + d * 0.1)) },
    { l: 'Пауза при выборе карточки', v: cfg.pauseCards ? 'вкл' : 'выкл', f: () => cfg.pauseCards = !cfg.pauseCards }];
  for (const [k, n] of KEYROWS) r.push({ l: 'Клавиша: ' + n, v: rebind === k ? 'нажми клавишу…' : kn(cfg.keys[k]), f: () => rebind = k });
  r.push({ l: 'Назад (Esc)', v: '', f: () => view = null }); return r;
}
const rowY = i => 80 + i * 40;
function drawSettings() {
  g.fillStyle = 'rgba(14,27,24,.95)'; g.fillRect(0, 0, W, H); txt('Настройки', W / 2, 54, 34, '#7be236', 'center');
  srows().forEach((r, i) => { txt(r.l, 250, rowY(i) + 24, 20); if (r.v) txt((i < 2 ? '−   ' : '') + r.v + (i < 2 ? '   +' : ''), 700, rowY(i) + 24, 20, '#cfc', 'center'); });
}
function clickSettings() { srows().forEach((r, i) => { if (m.y > rowY(i) && m.y < rowY(i) + 34) { r.f(i < 2 ? (m.x > 700 ? 1 : -1) : 0); save(); } }); }
start(); S.over = 'menu';
let last = performance.now(), acc = 0;
(function loop(n) { acc += Math.min(0.25, (n - last) / 1000); last = n; while (acc >= DT) { update(); acc -= DT; } draw(); requestAnimationFrame(loop); })(last);
