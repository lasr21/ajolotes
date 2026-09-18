/**
 * Entidades de la ronda: ajolotes (jugador y bots) y bugs.
 * Son objetos mutables que solo toca el engine (DESIGN.md §9.3).
 */
import {
  BUBBLE_FONT,
  BUBBLE_FONT_BIG,
  BUBBLE_HEIGHT,
  BUBBLE_HEIGHT_BIG,
  BUBBLE_PAD_X,
  BUG_LIFETIME,
  BUG_MAX_RADIUS,
  SPAWN_MARGIN,
  WORLD_H,
  WORLD_W,
} from "./config";
import type { AccessoryId, BugType, Stack } from "./types";

// ---------------------------------------------------------------------------
// Ajolotes

export type AxolotlKind = "player" | "bot";

export interface Axolotl {
  kind: AxolotlKind;
  name: string;
  stack: Stack;
  accessory: AccessoryId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 1 mira a la derecha, -1 a la izquierda. */
  dir: 1 | -1;
  targetX: number;
  targetY: number;
  maxSpeed: number;
  steer: number;
  score: number;
  /** Fase acumulada del nado; avanza con la velocidad. */
  swimPhase: number;
  /** Desfase del vaivén vertical para que no naden todos igual. */
  bobPhase: number;
}

export function createAxolotl(
  init: Pick<Axolotl, "kind" | "name" | "stack" | "accessory" | "maxSpeed" | "steer"> & {
    x: number;
    y: number;
  },
): Axolotl {
  return {
    ...init,
    vx: 0,
    vy: 0,
    dir: 1,
    targetX: init.x,
    targetY: init.y,
    score: 0,
    swimPhase: Math.random() * Math.PI * 2,
    bobPhase: Math.random() * Math.PI * 2,
  };
}

// ---------------------------------------------------------------------------
// Bugs

export type NormalBugType = Exclude<BugType, "worksOnMyMachine" | "fridayDeploy">;

export type BugMotion = "drift" | "zigzag";

export interface BugDef {
  text: string;
  points: number;
  speed: number;
  /** Peso relativo de aparición. */
  weight: number;
  motion: BugMotion;
  big: boolean;
}

/** Los 3 bugs normales de P0 (DESIGN.md §6.2). */
export const BUG_DEFS: Record<NormalBugType, BugDef> = {
  undefined: { text: "undefined", points: 1, speed: 25, weight: 50, motion: "drift", big: false },
  nan: { text: "NaN", points: 2, speed: 45, weight: 30, motion: "zigzag", big: false },
  objectObject: {
    text: "[object Object]",
    points: 3,
    speed: 15,
    weight: 20,
    motion: "drift",
    big: true,
  },
};

export const NORMAL_BUG_TYPES = Object.keys(BUG_DEFS) as NormalBugType[];

export interface Bug {
  type: NormalBugType;
  def: BugDef;
  x: number;
  y: number;
  /** Dirección unitaria del movimiento base. */
  dx: number;
  dy: number;
  /** Fase del zigzag. */
  phase: number;
  age: number;
  /** Ya expiró y va saliendo del estanque. */
  leaving: boolean;
  /** Ya se registró como perdido. */
  counted: boolean;
  width: number;
  height: number;
  fontSize: number;
  radius: number;
}

export function pickBugType(): NormalBugType {
  const total = NORMAL_BUG_TYPES.reduce((sum, t) => sum + BUG_DEFS[t].weight, 0);
  let r = Math.random() * total;
  for (const t of NORMAL_BUG_TYPES) {
    r -= BUG_DEFS[t].weight;
    if (r <= 0) return t;
  }
  return NORMAL_BUG_TYPES[0];
}

/**
 * Crea un bug en una posición libre del mundo. `measure` devuelve el ancho
 * del texto con la fuente de la burbuja; lo aporta el engine porque tiene
 * el contexto del canvas.
 */
export function createBug(
  type: NormalBugType,
  measure: (text: string, fontSize: number) => number,
): Bug {
  const def = BUG_DEFS[type];
  const fontSize = def.big ? BUBBLE_FONT_BIG : BUBBLE_FONT;
  const width = measure(def.text, fontSize) + BUBBLE_PAD_X * 2;
  const height = def.big ? BUBBLE_HEIGHT_BIG : BUBBLE_HEIGHT;
  const angle = Math.random() * Math.PI * 2;
  return {
    type,
    def,
    x: SPAWN_MARGIN + Math.random() * (WORLD_W - SPAWN_MARGIN * 2),
    y: SPAWN_MARGIN + Math.random() * (WORLD_H - SPAWN_MARGIN * 2),
    dx: Math.cos(angle),
    dy: Math.sin(angle),
    phase: Math.random() * Math.PI * 2,
    age: 0,
    leaving: false,
    counted: false,
    width,
    height,
    fontSize,
    radius: Math.min(BUG_MAX_RADIUS, width / 2),
  };
}

export function bugExpired(bug: Bug): boolean {
  return bug.age >= BUG_LIFETIME;
}

/** Ya salió del mundo (después de irse nadando). */
export function bugOffscreen(bug: Bug): boolean {
  const m = bug.width;
  return bug.x < -m || bug.x > WORLD_W + m || bug.y < -m || bug.y > WORLD_H + m;
}
