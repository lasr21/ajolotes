export type Stack = "react" | "vue" | "angular" | "svelte";

export type AccessoryId =
  | "none"
  | "charro"
  | "sunglasses"
  | "wizard"
  | "hardhat"
  | "headphones"
  | "crown";

export type BugType =
  | "undefined"
  | "nan"
  | "objectObject"
  | "worksOnMyMachine"
  | "fridayDeploy";

export interface Palette {
  piel: string;
  panza: string;
  branquias: string;
}

/** Lo que el jugador elige en el camerino. */
export interface PlayerConfig {
  stack: Stack;
  accessory: AccessoryId;
}

export interface RoundStats {
  stack: Stack;
  accessory: AccessoryId;
  score: number;
  /** Lo que se comió el jugador. */
  eaten: Record<BugType, number>;
  /** Expiraron o se los comió un bot. */
  missed: Record<Exclude<BugType, "fridayDeploy">, number>;
  /** Según STREAK_WINDOW. */
  bestStreak: number;
  /** Según IDLE_SPEED, redondeado. */
  idleSeconds: number;
  /** 1 = primero. */
  place: number;
  /** Jugador + bots. */
  totalPlayers: number;
  /** El bot justo arriba; null si quedó primero. */
  beatenBy: { name: string; stack: Stack } | null;
  /** null si ganó el jugador. */
  winner: { name: string; stack: Stack; score: number } | null;
}

export const STACKS: readonly Stack[] = ["react", "vue", "angular", "svelte"];

export const STACK_LABELS: Record<Stack, string> = {
  react: "React",
  vue: "Vue",
  angular: "Angular",
  svelte: "Svelte",
};
