/**
 * Acumulación de estadísticas durante la ronda y armado de `RoundStats`
 * (DESIGN.md §6.4). Todo mutable y en manos del engine.
 */
import { IDLE_SPEED, STREAK_WINDOW } from "./config";
import type { Axolotl } from "./entities";
import type { BugType, PlayerConfig, RoundStats } from "./types";

type MissedType = Exclude<BugType, "fridayDeploy">;

export interface RoundTracker {
  eaten: Record<BugType, number>;
  missed: Record<MissedType, number>;
  streak: number;
  bestStreak: number;
  lastEatAt: number | null;
  idleSeconds: number;
}

export function createTracker(): RoundTracker {
  return {
    eaten: { undefined: 0, nan: 0, objectObject: 0, worksOnMyMachine: 0, fridayDeploy: 0 },
    missed: { undefined: 0, nan: 0, objectObject: 0, worksOnMyMachine: 0 },
    streak: 0,
    bestStreak: 0,
    lastEatAt: null,
    idleSeconds: 0,
  };
}

/** El jugador se comió un bug en el segundo `now` de la ronda. */
export function trackEaten(t: RoundTracker, type: BugType, now: number): void {
  t.eaten[type] += 1;
  if (t.lastEatAt !== null && now - t.lastEatAt <= STREAK_WINDOW) {
    t.streak += 1;
  } else {
    t.streak = 1;
  }
  t.bestStreak = Math.max(t.bestStreak, t.streak);
  t.lastEatAt = now;
}

/** Un bug expiró o se lo comió un bot. */
export function trackMissed(t: RoundTracker, type: MissedType): void {
  t.missed[type] += 1;
}

export function trackIdle(t: RoundTracker, speed: number, dt: number): void {
  if (speed < IDLE_SPEED) t.idleSeconds += dt;
}

/** Ordena por puntos; los empates los gana el jugador. */
export function rankAxolotls(all: readonly Axolotl[]): Axolotl[] {
  return [...all].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.kind === "player") return -1;
    if (b.kind === "player") return 1;
    return 0;
  });
}

export function playerPlace(player: Axolotl, all: readonly Axolotl[]): number {
  let ahead = 0;
  for (const a of all) if (a !== player && a.score > player.score) ahead += 1;
  return ahead + 1;
}

export function buildRoundStats(
  config: PlayerConfig,
  player: Axolotl,
  all: readonly Axolotl[],
  t: RoundTracker,
): RoundStats {
  const ranking = rankAxolotls(all);
  const place = playerPlace(player, all);
  const above = place > 1 ? ranking[place - 2] : null;
  const first = ranking[0];
  return {
    stack: config.stack,
    accessory: config.accessory,
    score: player.score,
    eaten: { ...t.eaten },
    missed: { ...t.missed },
    bestStreak: t.bestStreak,
    idleSeconds: Math.round(t.idleSeconds),
    place,
    totalPlayers: all.length,
    beatenBy: above && above.kind === "bot" ? { name: above.name, stack: above.stack } : null,
    winner:
      first && first.kind === "bot"
        ? { name: first.name, stack: first.stack, score: first.score }
        : null,
  };
}
