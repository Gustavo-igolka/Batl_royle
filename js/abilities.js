// Способности по id. Слоты (main / a1 / a2) берутся из data/characters.js.
// use(ctx) возвращает false, если способность не сработала (кулдаун не тратится).
import { B } from './data/balance.js';
const ang = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const ABIL = {
  knife: { name: 'Нож', cd: B.knife.cd, use(c) {
    const p = c.S.p; p.swing = 0.15;
    for (const e of c.S.en) if (e.alive) {
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      if (c.dist(e, p) < B.knife.range + B.enemies[e.t].r && Math.abs(ang(a, p.face)) < B.knife.arc / 2) c.hit(e, B.knife.dmg, 0, Math.cos(a), Math.sin(a));
    } } },
  ak: { name: 'АК', cd: B.ak.cd, use(c) { const p = c.S.p; c.S.bul.push({ x: p.x, y: p.y, vx: Math.cos(p.face), vy: Math.sin(p.face), life: 1.2 }); } },
  // busy: пока true, кулдаун заморожен (отсчёт начнётся после исчезновения миньонов)
  minions: { name: 'Миньоны', cd: B.minion.after, busy: c => c.S.min.length > 0, use(c) {
    if (c.S.min.length) return false; const p = c.S.p;
    for (let i = 0; i < B.minion.n; i++) c.S.min.push({ x: p.x + (i ? 20 : -20), y: p.y }); } },
};
