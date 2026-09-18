/**
 * Bots con personalidad por stack (DESIGN.md §6.3). Siempre se muestran como
 * bots; la dificultad se ajusta en config, nunca tocando el marcador.
 */
import botNames from "@/data/bot-names.json";
import {
  BOT_COUNT,
  BOT_CROWD_PENALTY,
  BOT_SEPARATION,
  BOT_SEPARATION_PUSH,
  BOT_IGNORE_CHANCE,
  BOT_PERSONALITIES,
  BOT_REACTION_MAX,
  BOT_REACTION_MIN,
  BOT_SPAWN_CLEARANCE,
  BOT_SPEED_SCALE,
  BOT_STEER,
  MOUTH_OFFSET_X,
  SPRITE_H,
  SPRITE_W,
  WORLD_H,
  WORLD_W,
  type BotPersonality,
} from "./config";
import { createAxolotl, type Axolotl, type Bug } from "./entities";
import { STACKS, type Stack } from "./types";

const NAMES = botNames as Record<Stack, string[]>;

export interface BotBrain {
  personality: BotPersonality;
  /** Segundos hasta volver a elegir objetivo. */
  retargetIn: number;
  /** El bug perseguido, o null si nada sin rumbo. */
  target: Bug | null;
  /** Momento de la ronda a partir del cual reacciona al objetivo nuevo. */
  reactAt: number;
  /** Bugs que decidió ignorar. */
  ignored: WeakSet<Bug>;
}

export interface Bot {
  axolotl: Axolotl;
  brain: BotBrain;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Reparte BOT_COUNT bots entre los 4 stacks, con nombres únicos. */
export function createBots(player: Axolotl): Bot[] {
  const stacks = shuffle([...STACKS]);
  const pools: Record<Stack, string[]> = {
    react: shuffle(NAMES.react),
    vue: shuffle(NAMES.vue),
    angular: shuffle(NAMES.angular),
    svelte: shuffle(NAMES.svelte),
  };

  const bots: Bot[] = [];
  for (let i = 0; i < BOT_COUNT; i++) {
    const stack = stacks[i % stacks.length];
    const name = pools[stack].pop() ?? `${stack}_bot_${i}`;
    const personality = BOT_PERSONALITIES[stack];

    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 20; tries++) {
      x = randomBetween(SPRITE_W, WORLD_W - SPRITE_W);
      y = randomBetween(SPRITE_H * 2, WORLD_H - SPRITE_H * 2);
      if (Math.hypot(x - player.x, y - player.y) >= BOT_SPAWN_CLEARANCE) break;
    }

    const axolotl = createAxolotl({
      kind: "bot",
      name,
      stack,
      accessory: "none",
      maxSpeed: personality.speed * BOT_SPEED_SCALE,
      steer: BOT_STEER,
      x,
      y,
    });

    bots.push({
      axolotl,
      brain: {
        personality,
        retargetIn: Math.random() * personality.retargetEvery,
        target: null,
        reactAt: 0,
        ignored: new WeakSet(),
      },
    });
  }
  return bots;
}

function mouthOf(a: Axolotl) {
  return { x: a.x + MOUTH_OFFSET_X * a.dir, y: a.y };
}

function chooseTarget(bot: Bot, bugs: readonly Bug[], others: readonly Bot[]): Bug | null {
  const { axolotl: a, brain } = bot;
  const mouth = mouthOf(a);
  let best: Bug | null = null;
  let bestScore = -Infinity;

  for (const bug of bugs) {
    if (bug.leaving) continue;
    if (brain.ignored.has(bug)) continue;
    // Un bug que ya persiguen otros bots "queda más lejos": así se reparten.
    let competitors = 0;
    for (const o of others) if (o !== bot && o.brain.target === bug) competitors += 1;
    const dist = Math.hypot(bug.x - mouth.x, bug.y - mouth.y) + competitors * BOT_CROWD_PENALTY;
    let score: number;
    switch (brain.personality.strategy) {
      case "nearest":
        score = -dist;
        break;
      case "bestValue":
        score = bug.def.points / (dist + 40);
        break;
      case "mostPoints":
        // Más puntos primero; a igual puntaje, el más cercano.
        score = bug.def.points * 10000 - dist;
        break;
    }
    if (score > bestScore) {
      bestScore = score;
      best = bug;
    }
  }
  return best;
}

/** Apunta la boca del bot al bug, según el lado por el que llega. */
function aimAt(a: Axolotl, bug: Bug) {
  const dir = bug.x >= a.x ? 1 : -1;
  a.targetX = bug.x - MOUTH_OFFSET_X * dir;
  a.targetY = bug.y;
}

/**
 * Decide objetivos. El movimiento lo hace el engine con la misma función
 * que usa para el jugador.
 */
export function updateBotBrains(bots: readonly Bot[], bugs: readonly Bug[], dt: number, now: number) {
  for (const bot of bots) {
    const { axolotl: a, brain } = bot;
    brain.retargetIn -= dt;

    // Si el objetivo se fue (comido o expirado), reconsidera de inmediato.
    if (brain.target && brain.target.leaving) {
      brain.target = null;
      brain.retargetIn = 0;
    }

    if (brain.retargetIn <= 0) {
      brain.retargetIn = brain.personality.retargetEvery;
      brain.reactAt = now + randomBetween(BOT_REACTION_MIN, BOT_REACTION_MAX);

      if (Math.random() < brain.personality.wanderChance) {
        // Se distrae y nada sin rumbo.
        brain.target = null;
        a.targetX = randomBetween(SPRITE_W, WORLD_W - SPRITE_W);
        a.targetY = randomBetween(SPRITE_H, WORLD_H - SPRITE_H);
        continue;
      }

      const next = chooseTarget(bot, bugs, bots);
      if (next && next !== brain.target && Math.random() < BOT_IGNORE_CHANCE) {
        brain.ignored.add(next);
        brain.target = null;
        continue;
      }
      brain.target = next;
    }

    // Sigue al objetivo solo después del retraso de reacción.
    if (brain.target && now >= brain.reactAt) aimAt(a, brain.target);
  }
}

/** Empuja suavemente a los bots que se encimen, para que no formen una bola. */
export function separateBots(bots: readonly Bot[], dt: number) {
  for (let i = 0; i < bots.length; i++) {
    const a = bots[i].axolotl;
    for (let j = i + 1; j < bots.length; j++) {
      const b = bots[j].axolotl;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist === 0 || dist >= BOT_SEPARATION) continue;
      const push = ((BOT_SEPARATION - dist) / BOT_SEPARATION) * BOT_SEPARATION_PUSH * dt;
      const nx = dx / dist;
      const ny = dy / dist;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }
}
