/**
 * Validación de `RoundStats` para /api/review (DESIGN.md §7.1).
 * Solo enums cerrados y números acotados: nada de texto libre del usuario.
 */
import { z } from "zod";
import botNames from "@/data/bot-names.json";

export const stackSchema = z.enum(["react", "vue", "angular", "svelte"]);

export const accessorySchema = z.enum([
  "none",
  "charro",
  "sunglasses",
  "wizard",
  "hardhat",
  "headphones",
  "crown",
]);

const count = z.number().int().min(0).max(200);

/**
 * Los nombres de bots solo pueden ser los de nuestro JSON. Así ningún texto
 * escrito por el usuario llega al prompt (regla 6).
 */
const KNOWN_NAMES = new Set(Object.values(botNames as Record<string, string[]>).flat());
const botName = z.string().refine((n) => KNOWN_NAMES.has(n), "Nombre de bot desconocido");

export const roundStatsSchema = z.object({
  stack: stackSchema,
  accessory: accessorySchema,
  score: z.number().int().min(-100).max(1000),
  eaten: z.object({
    undefined: count,
    nan: count,
    objectObject: count,
    worksOnMyMachine: count,
    fridayDeploy: count,
  }),
  missed: z.object({
    undefined: count,
    nan: count,
    objectObject: count,
    worksOnMyMachine: count,
  }),
  bestStreak: count,
  idleSeconds: z.number().int().min(0).max(60),
  place: z.number().int().min(1).max(50),
  totalPlayers: z.number().int().min(1).max(50),
  beatenBy: z.object({ name: botName, stack: stackSchema }).nullable(),
  winner: z.object({ name: botName, stack: stackSchema, score: z.number().int().min(-100).max(1000) }).nullable(),
});

export type ValidatedRoundStats = z.infer<typeof roundStatsSchema>;
