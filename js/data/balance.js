// Все числа игры. Скорости в "старых единицах", K переводит их в px/сек.
export const K = 32;
export const B = {
  player: { hp: 100, maxHp: 200, speed: 8, iframes: 0.35, r: 22 },
  hit: 0.85, // хитбокс = 85% от видимого радиуса (честнее к игроку)
  knife: { dmg: [20, 17], cd: 0.8, range: 90, arc: Math.PI * 0.9 },
  ak: { dmg: [20, 15], cd: 7, speed: 900, kb: 15, heal: 5 },
  minion: { n: 2, speed: 3.5, dmg: [10, 6], heal: 3, after: 5, r: 10 },
  passive: { medkitBonus: 5, coffeeBonus: 1 },
  enemies: {
    red:    { hp: 110, speed: 5, res: 0, contact: 6, r: 30 },
    blue:   { hp: 170, speed: 3, res: 2, contact: 6, r: 36 },
    green:  { hp: 70,  speed: 7, res: 1, contact: 3, r: 26 },
    yellow: { hp: 70,  speed: 2, res: 1, contact: 6, r: 26, shot: { every: 3, speed: 10, life: 3, turnAt: 1.5, dmg: 6 } },
  },
  pule: { speed: 9, contact: 5, every: 8, aim: 0.3, w: 44, h: 22 },
  medkit: { every: 50, heal: 30 },
  coffee: { every: 40, speed: 3, time: 10 },
  cards: { first: 10, every: 20, fire: 5, water: 2, stone: 5, elec: 2 },
  rush: { hp: 50, kills: 35, time: 94 },
  respawn: 1.2,
  // крутость: буквы F→P, порог очков для каждой, изменения за действия
  rank: { letters: 'FEDCBASP', at: [0, 5, 9, 13, 17, 21, 24, 26], max: Infinity, decay: 0.5, hurt: 1, comboTime: 3, item: 1, a1: 1, a2: 2,
    kill: { red: 1, blue: 2, green: 1, yellow: 2 }, card: { fire: 2, water: -2, stone: 1, elec: 1 } },
};
