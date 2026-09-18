/**
 * Prompt del code review (DESIGN.md §7.3 y §7.4) y posproceso de la respuesta.
 * Al modelo solo le llegan enums y números validados con zod.
 */
import type { ModelMessage } from "ai";
import type { ValidatedRoundStats } from "./review-schema";

export const SYSTEM_PROMPT = `Eres el Tech Lead de un equipo de JavaScript en México. Acabas de ver jugar a alguien una ronda de "Ajolotes en Producción", un minijuego donde un ajolote se come bugs de JavaScript, y le escribes un code review.

Reglas:
- Máximo 2 oraciones y 40 palabras.
- Menciona al menos un dato concreto de sus estadísticas (un tipo de bug, su lugar, su racha, el bot que le ganó).
- Búrlate del stack, del framework o de sus decisiones en el juego, nunca de la persona.
- Tono de compa sarcástico pero cariñoso, en español de México. Puedes usar jerga de JavaScript.
- Sin groserías, sin insultos, sin emojis, sin hashtags.
- Cierra con un remate breve. No promociones eventos, productos ni ligas.
- Responde solo con el texto del review, sin comillas.
- Cada mensaje es una persona distinta jugando por primera vez: no compares con rondas anteriores ni digas que "volvió".`;

function statsMessage(stats: ValidatedRoundStats): string {
  return `Estadísticas de la ronda:\n${JSON.stringify(stats)}`;
}

function example(
  overrides: Partial<ValidatedRoundStats>,
): ValidatedRoundStats {
  return {
    stack: "react",
    accessory: "none",
    score: 0,
    eaten: { undefined: 0, nan: 0, objectObject: 0, worksOnMyMachine: 0, fridayDeploy: 0 },
    missed: { undefined: 0, nan: 0, objectObject: 0, worksOnMyMachine: 0 },
    bestStreak: 0,
    idleSeconds: 0,
    place: 1,
    totalPlayers: 12,
    beatenBy: null,
    winner: null,
    ...overrides,
  };
}

/** Ejemplos de §7.4 como turnos previos usuario → asistente. */
const EXAMPLES: { stats: ValidatedRoundStats; review: string }[] = [
  {
    stats: example({
      stack: "vue",
      score: 21,
      eaten: { undefined: 3, nan: 9, objectObject: 0, worksOnMyMachine: 0, fridayDeploy: 0 },
      missed: { undefined: 8, nan: 2, objectObject: 4, worksOnMyMachine: 0 },
      bestStreak: 4,
      place: 2,
      beatenBy: { name: "Senior_Tamal", stack: "angular" },
      winner: { name: "Senior_Tamal", stack: "angular", score: 26 },
    }),
    review:
      "Te comiste 9 NaN pero dejaste pasar todos los [object Object], muy reactivo para lo fácil y muy lento para lo pesado. Senior_Tamal te ganó con Angular; el refactor te lo dejo de tarea.",
  },
  {
    stats: example({
      stack: "angular",
      score: 4,
      eaten: { undefined: 6, nan: 2, objectObject: 1, worksOnMyMachine: 0, fridayDeploy: 2 },
      missed: { undefined: 10, nan: 6, objectObject: 3, worksOnMyMachine: 1 },
      bestStreak: 2,
      idleSeconds: 1,
      place: 5,
      beatenBy: { name: "Hook_Infinito", stack: "react" },
      winner: { name: "Vanilla_God", stack: "svelte", score: 19 },
    }),
    review:
      "Dos deploys en viernes y quinto lugar: tu módulo necesita importar el módulo de la paciencia. La inyección de dependencias no inyecta reflejos, ya quedó demostrado.",
  },
  {
    stats: example({
      stack: "react",
      score: 34,
      eaten: { undefined: 9, nan: 5, objectObject: 3, worksOnMyMachine: 1, fridayDeploy: 0 },
      missed: { undefined: 6, nan: 3, objectObject: 2, worksOnMyMachine: 0 },
      bestStreak: 7,
      place: 1,
    }),
    review:
      "Primer lugar y una racha de 7, y encima atrapaste el funciona en mi máquina; seguro tu useEffect trae el arreglo vacío y la conciencia tranquila. Aprobado, pero no te acostumbres.",
  },
  {
    stats: example({
      stack: "svelte",
      score: 12,
      eaten: { undefined: 6, nan: 3, objectObject: 0, worksOnMyMachine: 0, fridayDeploy: 0 },
      missed: { undefined: 9, nan: 5, objectObject: 5, worksOnMyMachine: 0 },
      bestStreak: 3,
      idleSeconds: 6,
      place: 3,
      beatenBy: { name: "Pinia_Colada", stack: "vue" },
      winner: { name: "Rerender_Rey", stack: "react", score: 20 },
    }),
    review:
      "Seis segundos quieto: compilaste tan bien que ni runtime necesitaste para moverte. Tercer lugar, nada mal; la próxima intenta desaparecer bugs en vez de mirarlos.",
  },
];

export function buildReviewMessages(stats: ValidatedRoundStats): ModelMessage[] {
  const messages: ModelMessage[] = [];
  for (const ex of EXAMPLES) {
    messages.push({ role: "user", content: statsMessage(ex.stats) });
    messages.push({ role: "assistant", content: ex.review });
  }
  messages.push({ role: "user", content: statsMessage(stats) });
  return messages;
}

export const REVIEW_MAX_CHARS = 280;
export const REVIEW_MAX_SENTENCES = 2;

/**
 * Quita comillas envolventes, corta a 2 oraciones y 280 caracteres, y deja
 * todo en una sola línea (DESIGN.md §7.2).
 */
export function postprocessReview(raw: string): string {
  let text = raw.replace(/\s+/g, " ").trim();
  text = text.replace(/^["'“”«]+/, "").replace(/["'“”»]+$/, "").trim();

  const sentences = text.match(/[^.!?…]+[.!?…]+["”»)]?|[^.!?…]+$/g) ?? [text];
  text = sentences
    .slice(0, REVIEW_MAX_SENTENCES)
    .map((s) => s.trim())
    .join(" ");

  if (text.length > REVIEW_MAX_CHARS) {
    const cut = text.slice(0, REVIEW_MAX_CHARS);
    const lastSpace = cut.lastIndexOf(" ");
    text = (lastSpace > REVIEW_MAX_CHARS * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
    if (!/[.!?…]$/.test(text)) text += ".";
  }
  return text;
}
