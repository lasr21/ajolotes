/**
 * Todos los números del juego viven aquí (DESIGN.md §6.1).
 * Ajusta jugando; nunca alteres el marcador para cambiar la dificultad.
 */

// Mundo y ronda
export const WORLD_W = 360;
export const WORLD_H = 640;
export const ROUND_SECONDS = 20;

// Sprite del ajolote en unidades de mundo
export const SPRITE_W = 60;
export const SPRITE_H = 30;
/** El rasterizado se hace a este múltiplo del tamaño del sprite. */
export const SPRITE_SCALE = 2;
/** Límite de devicePixelRatio para el canvas. */
export const MAX_DPR = 2;

// Colisión: círculo en la punta de la cabeza (x + 24·dir, y)
export const MOUTH_RADIUS = 12;
export const MOUTH_OFFSET_X = 24;

// Jugador
export const PLAYER_MAX_SPEED = 240;
export const PLAYER_STEER = 8;
export const TOUCH_OFFSET_Y = 36;

// Bots
export const BOT_COUNT = 11;
export const BOT_SPEED_SCALE = 1.0;

// Bugs
export const MAX_BUGS = 14;
export const SPAWN_EVERY = 0.35;
export const BUG_LIFETIME = 6;

// Estadísticas
export const STREAK_WINDOW = 2;
export const IDLE_SPEED = 10;

// Animación de nado (§5.4)
export const SWIM_STRIPS = 12;
export const SWIM_AMPLITUDE = 2;
export const SWIM_AMPLITUDE_REDUCED = 0.5;
export const SWIM_BOB_AMPLITUDE = 1;
export const SWIM_BOB_HZ = 1.5;
export const FLIP_HYSTERESIS = 15;

// Movimiento de bugs
/** Velocidad con la que un bug expirado se va nadando fuera del estanque. */
export const BUG_LEAVE_SPEED = 140;
/** Zigzag de NaN: frecuencia (Hz) y velocidad lateral (u/s). */
export const ZIGZAG_HZ = 1.6;
export const ZIGZAG_SIDE_SPEED = 60;
/** Margen desde el borde al aparecer y al rebotar. */
export const SPAWN_MARGIN = 28;
/** Radio de colisión máximo de una burbuja. */
export const BUG_MAX_RADIUS = 20;
/** Segundos antes de expirar en los que la burbuja parpadea. */
export const BUG_WARN_SECONDS = 1.2;

// Dibujo de burbujas y etiquetas (unidades de mundo)
export const BUBBLE_PAD_X = 8;
export const BUBBLE_HEIGHT = 22;
export const BUBBLE_HEIGHT_BIG = 26;
export const BUBBLE_FONT = 12;
export const BUBBLE_FONT_BIG = 13;
export const LABEL_FONT = 10;
export const LABEL_GAP = 6;

// HUD (unidades de mundo)
export const HUD_PAD = 12;
export const HUD_FONT = 16;
export const HUD_TIME_FONT = 28;

// Nado: velocidad angular base y por unidad de velocidad, y desfase entre tiras.
export const SWIM_OMEGA_BASE = 4;
export const SWIM_OMEGA_PER_SPEED = 0.03;
export const SWIM_WAVE_K = 0.55;

// Burbujas decorativas del fondo (se apagan con prefers-reduced-motion)
export const DECOR_BUBBLES = 10;
export const DECOR_BUBBLE_SPEED = 18;

/** Colores del estanque, tomados de los tokens de DESIGN.md §4. */
export const COLORS = {
  agua: "#0E4A55",
  aguaProfunda: "#09343C",
  lirio: "#EAF4EF",
  tinta: "#2A1F2D",
  trajinera: "#FFC83D",
  bug: "#FFE27A",
  viernes: "#C81E3A",
} as const;

// Bots (DESIGN.md §6.3). La velocidad se multiplica por BOT_SPEED_SCALE.
export type BotStrategy = "nearest" | "bestValue" | "mostPoints";

export interface BotPersonality {
  speed: number;
  /** Segundos entre cambios de objetivo. */
  retargetEvery: number;
  strategy: BotStrategy;
  /** Probabilidad de distraerse y nadar sin rumbo al elegir objetivo. */
  wanderChance: number;
  /** Probabilidad de comerse el "deploy en viernes" (P1). */
  fridayChance: number;
}

export const BOT_PERSONALITIES: Record<"react" | "vue" | "angular" | "svelte", BotPersonality> = {
  react: { speed: 215, retargetEvery: 0.4, strategy: "nearest", wanderChance: 0, fridayChance: 0 },
  vue: { speed: 195, retargetEvery: 0.8, strategy: "bestValue", wanderChance: 0, fridayChance: 0 },
  angular: {
    speed: 160,
    retargetEvery: 1.2,
    strategy: "mostPoints",
    wanderChance: 0,
    fridayChance: 0,
  },
  svelte: {
    speed: 230,
    retargetEvery: 0.6,
    strategy: "nearest",
    wanderChance: 0.15,
    fridayChance: 0.2,
  },
};

/** Retraso de reacción al elegir un objetivo nuevo, en segundos. */
export const BOT_REACTION_MIN = 0.15;
export const BOT_REACTION_MAX = 0.3;
/** Probabilidad de ignorar un bug por completo. */
export const BOT_IGNORE_CHANCE = 0.1;
/** Suavizado de dirección de los bots (el jugador usa PLAYER_STEER). */
export const BOT_STEER = 6;
/** Distancia mínima entre el jugador y los bots al iniciar. */
export const BOT_SPAWN_CLEARANCE = 90;
/** Distancia extra que "ve" un bot en un bug que ya persigue otro bot. */
export const BOT_CROWD_PENALTY = 70;
/** Distancia mínima entre bots antes de empujarse suavemente. */
export const BOT_SEPARATION = 34;
export const BOT_SEPARATION_PUSH = 40;
