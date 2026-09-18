/**
 * Reseñas de respaldo (DESIGN.md §7.5). Se usan cuando el modelo falla, tarda
 * o la entrada no es válida. Suenan específicas gracias a los placeholders.
 */
import fallbackReviews from "@/data/fallback-reviews.json";
import type { RoundStats, Stack } from "@/game/types";

const TEMPLATES = fallbackReviews as Record<Stack, string[]>;

type FallbackInput = Pick<RoundStats, "stack" | "score" | "place" | "totalPlayers" | "bestStreak"> & {
  beatenBy: { name: string } | null;
};

export function fallbackReview(stats: FallbackInput): string {
  const all = TEMPLATES[stats.stack] ?? TEMPLATES.react;
  const usable = all.filter((t) => stats.beatenBy !== null || !t.includes("{beatenBy}"));
  const pool = usable.length > 0 ? usable : all;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return fillTemplate(template, stats);
}

function fillTemplate(template: string, stats: FallbackInput): string {
  return template
    .replaceAll("{score}", String(stats.score))
    .replaceAll("{place}", String(stats.place))
    .replaceAll("{total}", String(stats.totalPlayers))
    .replaceAll("{bestStreak}", String(stats.bestStreak))
    .replaceAll("{beatenBy}", stats.beatenBy?.name ?? "otro ajolote");
}

/** Cuando ni siquiera hay estadísticas válidas. */
export const GENERIC_FALLBACK: FallbackInput = {
  stack: "react",
  score: 0,
  place: 12,
  totalPlayers: 12,
  bestStreak: 0,
  beatenBy: null,
};
