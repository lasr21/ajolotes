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
