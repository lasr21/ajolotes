/**
 * Loop del juego (DESIGN.md §9.3): un solo requestAnimationFrame, estado en
 * objetos mutables, HUD dibujado en el canvas. React llama `startRound` y
 * recibe `RoundStats` una sola vez, al final.
 */
import {
  BUG_LEAVE_SPEED,
  BUG_LIFETIME,
  BUG_WARN_SECONDS,
  COLORS,
  DECOR_BUBBLES,
  DECOR_BUBBLE_SPEED,
  FLIP_HYSTERESIS,
  HUD_FONT,
  HUD_PAD,
  HUD_TIME_FONT,
  INITIAL_BUGS,
  LABEL_FONT,
  LABEL_GAP,
  MAX_BUGS,
  MAX_DPR,
  MOUTH_OFFSET_X,
  MOUTH_RADIUS,
  PLAYER_MAX_SPEED,
  PLAYER_STEER,
  ROUND_SECONDS,
  SPAWN_EVERY,
  SPAWN_MARGIN,
  SPRITE_H,
  SPRITE_W,
  SWIM_AMPLITUDE,
  SWIM_AMPLITUDE_REDUCED,
  SWIM_BOB_AMPLITUDE,
  SWIM_BOB_HZ,
  SWIM_OMEGA_BASE,
  SWIM_OMEGA_PER_SPEED,
  SWIM_STRIPS,
  SWIM_WAVE_K,
  TOUCH_OFFSET_Y,
  WORLD_H,
  WORLD_W,
  ZIGZAG_HZ,
  ZIGZAG_SIDE_SPEED,
} from "./config";
import { createBots, separateBots, updateBotBrains, type Bot } from "./bots";
import {
  bugExpired,
  bugOffscreen,
  createAxolotl,
  createBug,
  pickBugType,
  type Axolotl,
  type Bug,
} from "./entities";
import { RASTER_H, RASTER_W, getSprite, paletteFor, prepareSprite } from "./sprites";
import {
  buildRoundStats,
  createTracker,
  playerPlace,
  trackEaten,
  trackIdle,
  trackMissed,
  type RoundTracker,
} from "./stats";
import type { PlayerConfig, RoundStats } from "./types";

export interface RoundHandle {
  /** Detiene el loop sin entregar estadísticas (desmontaje). */
  stop(): void;
}

export interface RoundOptions {
  reducedMotion?: boolean;
}

interface DecorBubble {
  x: number;
  y: number;
  r: number;
  speed: number;
}

interface RoundState {
  config: PlayerConfig;
  player: Axolotl;
  bots: Bot[];
  axolotls: Axolotl[];
  bugs: Bug[];
  tracker: RoundTracker;
  elapsed: number;
  spawnTimer: number;
  decor: DecorBubble[];
  paused: boolean;
  finished: boolean;
}

interface Fonts {
  ui: string;
  mono: string;
}

function readFonts(): Fonts {
  const css = getComputedStyle(document.documentElement);
  const ui = css.getPropertyValue("--font-fredoka").trim() || "sans-serif";
  const mono = css.getPropertyValue("--font-jetbrains-mono").trim() || "monospace";
  return { ui: `${ui}, sans-serif`, mono: `${mono}, monospace` };
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function startRound(
  canvas: HTMLCanvasElement,
  config: PlayerConfig,
  onEnd: (stats: RoundStats) => void,
  options: RoundOptions = {},
): RoundHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas sin contexto 2D");

  const reduced =
    options.reducedMotion ??
    (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const fonts = readFonts();

  const player = createAxolotl({
    kind: "player",
    name: "tú",
    stack: config.stack,
    accessory: config.accessory,
    maxSpeed: PLAYER_MAX_SPEED,
    steer: PLAYER_STEER,
    x: WORLD_W / 2,
    y: WORLD_H * 0.7,
  });

  const bots = createBots(player);
  const initialBugs: Bug[] = [];
  for (let i = 0; i < INITIAL_BUGS; i++) initialBugs.push(createBug(pickBugType(), measureText));

  const state: RoundState = {
    config,
    player,
    bots,
    // Los bots primero y el jugador al final, para que se dibuje encima.
    axolotls: [...bots.map((b) => b.axolotl), player],
    bugs: initialBugs,
    tracker: createTracker(),
    elapsed: 0,
    spawnTimer: 0,
    decor: reduced ? [] : createDecor(),
    paused: false,
    finished: false,
  };

  // Con ?debug en la URL se expone el estado de la ronda, solo para calibrar.
  if (new URLSearchParams(location.search).has("debug")) {
    (window as unknown as { __ajolotesRound?: RoundState }).__ajolotesRound = state;
  }

  // Por si el camerino no alcanzó a rasterizar.
  void prepareSprite(config.stack, config.accessory).catch(() => {});

  // -------------------------------------------------------------------------
  // Escalado del canvas

  let scale = 1;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    scale = Math.min(w / WORLD_W, h / WORLD_H);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  // -------------------------------------------------------------------------
  // Input

  function pointerToWorld(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WORLD_W;
    let y = ((e.clientY - rect.top) / rect.height) * WORLD_H;
    if (e.pointerType === "touch") y -= TOUCH_OFFSET_Y;
    player.targetX = clamp(x, SPRITE_W / 2, WORLD_W - SPRITE_W / 2);
    player.targetY = clamp(y, SPRITE_H / 2, WORLD_H - SPRITE_H / 2);
  }

  function onPointerDown(e: PointerEvent) {
    canvas.setPointerCapture(e.pointerId);
    pointerToWorld(e);
  }

  function onPointerMove(e: PointerEvent) {
    pointerToWorld(e);
  }

  function onVisibility() {
    state.paused = document.hidden;
    lastTs = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  document.addEventListener("visibilitychange", onVisibility);

  // -------------------------------------------------------------------------
  // Loop

  let rafId = 0;
  let lastTs: number | null = null;
  let stopped = false;

  function frame(ts: number) {
    if (stopped) return;
    rafId = requestAnimationFrame(frame);

    if (state.paused) {
      lastTs = null;
      draw();
      return;
    }
    if (lastTs === null) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    update(dt);
    draw();

    if (state.elapsed >= ROUND_SECONDS) finish();
  }

  function finish() {
    if (state.finished) return;
    state.finished = true;
    teardown();
    onEnd(buildRoundStats(config, player, state.axolotls, state.tracker));
  }

  function teardown() {
    stopped = true;
    cancelAnimationFrame(rafId);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("visibilitychange", onVisibility);
  }

  // -------------------------------------------------------------------------
  // Update

  function update(dt: number) {
    state.elapsed += dt;

    updateBotBrains(state.bots, state.bugs, dt, state.elapsed);
    for (const a of state.axolotls) updateAxolotl(a, dt);
    separateBots(state.bots, dt);
    trackIdle(state.tracker, Math.hypot(player.vx, player.vy), dt);

    // Aparición de bugs
    state.spawnTimer -= dt;
    const alive = state.bugs.filter((b) => !b.leaving).length;
    if (state.spawnTimer <= 0 && alive < MAX_BUGS) {
      state.bugs.push(createBug(pickBugType(), measureText));
      state.spawnTimer = SPAWN_EVERY;
    }

    // Movimiento y expiración de bugs
    for (const bug of state.bugs) updateBug(bug, dt);
    for (const bug of state.bugs) {
      if (!bug.leaving && bugExpired(bug)) {
        bug.leaving = true;
        // Sale por el borde más cercano.
        const toLeft = bug.x;
        const toRight = WORLD_W - bug.x;
        const toTop = bug.y;
        const toBottom = WORLD_H - bug.y;
        const min = Math.min(toLeft, toRight, toTop, toBottom);
        bug.dx = min === toLeft ? -1 : min === toRight ? 1 : 0;
        bug.dy = min === toTop ? -1 : min === toBottom ? 1 : 0;
        if (!bug.counted) {
          bug.counted = true;
          trackMissed(state.tracker, bug.type);
        }
      }
    }

    // Colisiones: boca contra burbuja. El jugador va al final de la lista,
    // así que se revisa primero: si llega junto con un bot, gana él.
    for (let i = state.axolotls.length - 1; i >= 0; i--) {
      const a = state.axolotls[i];
      const mx = a.x + MOUTH_OFFSET_X * a.dir;
      const my = a.y;
      for (const bug of state.bugs) {
        if (bug.leaving) continue;
        const r = MOUTH_RADIUS + bug.radius;
        const ddx = bug.x - mx;
        const ddy = bug.y - my;
        if (ddx * ddx + ddy * ddy <= r * r) {
          bug.leaving = true;
          bug.counted = true;
          bug.age = BUG_LIFETIME;
          bug.width = 0; // se elimina en la limpieza
          a.score += bug.def.points;
          if (a.kind === "player") trackEaten(state.tracker, bug.type, state.elapsed);
          else trackMissed(state.tracker, bug.type);
        }
      }
    }

    state.bugs = state.bugs.filter((b) => b.width > 0 && !(b.leaving && bugOffscreen(b)));

    for (const d of state.decor) {
      d.y -= d.speed * dt;
      if (d.y < -d.r) {
        d.y = WORLD_H + d.r;
        d.x = Math.random() * WORLD_W;
      }
    }
  }

  function updateAxolotl(a: Axolotl, dt: number) {
    // Velocidad deseada hacia el objetivo, con frenado al acercarse.
    const dx = a.targetX - a.x;
    const dy = a.targetY - a.y;
    const dist = Math.hypot(dx, dy);
    let desiredVx = 0;
    let desiredVy = 0;
    if (dist > 0.5) {
      const speed = Math.min(a.maxSpeed, dist * 6);
      desiredVx = (dx / dist) * speed;
      desiredVy = (dy / dist) * speed;
    }
    const k = Math.min(1, a.steer * dt);
    a.vx += (desiredVx - a.vx) * k;
    a.vy += (desiredVy - a.vy) * k;

    a.x = clamp(a.x + a.vx * dt, SPRITE_W / 2, WORLD_W - SPRITE_W / 2);
    a.y = clamp(a.y + a.vy * dt, SPRITE_H / 2, WORLD_H - SPRITE_H / 2);

    // Voltear con histéresis
    if (a.vx > FLIP_HYSTERESIS) a.dir = 1;
    else if (a.vx < -FLIP_HYSTERESIS) a.dir = -1;

    const speed = Math.hypot(a.vx, a.vy);
    a.swimPhase += (SWIM_OMEGA_BASE + speed * SWIM_OMEGA_PER_SPEED) * dt;
  }

  function updateBug(bug: Bug, dt: number) {
    bug.age += dt;
    if (bug.leaving) {
      bug.x += bug.dx * BUG_LEAVE_SPEED * dt;
      bug.y += bug.dy * BUG_LEAVE_SPEED * dt;
      return;
    }
    bug.x += bug.dx * bug.def.speed * dt;
    bug.y += bug.dy * bug.def.speed * dt;
    if (bug.def.motion === "zigzag") {
      bug.phase += ZIGZAG_HZ * Math.PI * 2 * dt;
      const side = Math.sin(bug.phase) * ZIGZAG_SIDE_SPEED * dt;
      // Perpendicular a la dirección base
      bug.x += -bug.dy * side;
      bug.y += bug.dx * side;
    }
    // Rebote en los bordes
    if (bug.x < SPAWN_MARGIN) {
      bug.x = SPAWN_MARGIN;
      bug.dx = Math.abs(bug.dx);
    } else if (bug.x > WORLD_W - SPAWN_MARGIN) {
      bug.x = WORLD_W - SPAWN_MARGIN;
      bug.dx = -Math.abs(bug.dx);
    }
    if (bug.y < SPAWN_MARGIN) {
      bug.y = SPAWN_MARGIN;
      bug.dy = Math.abs(bug.dy);
    } else if (bug.y > WORLD_H - SPAWN_MARGIN) {
      bug.y = WORLD_H - SPAWN_MARGIN;
      bug.dy = -Math.abs(bug.dy);
    }
  }

  function measureText(text: string, fontSize: number): number {
    ctx!.font = `500 ${fontSize}px ${fonts.mono}`;
    return ctx!.measureText(text).width;
  }

  // -------------------------------------------------------------------------
  // Draw

  function draw() {
    const c = ctx!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = COLORS.aguaProfunda;
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Centrar el mundo dentro del canvas
    const offX = (canvas.width - WORLD_W * scale) / 2;
    const offY = (canvas.height - WORLD_H * scale) / 2;
    c.setTransform(scale, 0, 0, scale, offX, offY);

    drawWater(c);
    for (const bug of state.bugs) drawBug(c, bug);
    for (const a of state.axolotls) drawAxolotl(c, a);
    drawHud(c);
  }

  function drawWater(c: CanvasRenderingContext2D) {
    c.fillStyle = COLORS.agua;
    c.fillRect(0, 0, WORLD_W, WORLD_H);

    c.strokeStyle = "rgba(234, 244, 239, 0.12)";
    c.lineWidth = 2;
    const t = reduced ? 0 : state.elapsed;
    for (let i = 0; i < 5; i++) {
      const baseY = 80 + i * 120;
      c.beginPath();
      for (let x = -20; x <= WORLD_W + 20; x += 20) {
        const y = baseY + Math.sin(x / 40 + t * 1.2 + i) * 4;
        if (x === -20) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }

    if (state.decor.length) {
      c.fillStyle = "rgba(234, 244, 239, 0.10)";
      for (const d of state.decor) {
        c.beginPath();
        c.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        c.fill();
      }
    }
  }

  function drawBug(c: CanvasRenderingContext2D, bug: Bug) {
    const remaining = BUG_LIFETIME - bug.age;
    let alpha = 1;
    if (bug.leaving) alpha = 0.6;
    else if (remaining < BUG_WARN_SECONDS && !reduced) {
      alpha = 0.55 + 0.45 * Math.abs(Math.sin(bug.age * 10));
    }
    c.globalAlpha = alpha;

    const w = bug.width;
    const h = bug.height;
    const x = bug.x - w / 2;
    const y = bug.y - h / 2;
    c.fillStyle = COLORS.bug;
    c.strokeStyle = COLORS.tinta;
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(x, y, w, h, h / 2);
    c.fill();
    c.stroke();

    c.fillStyle = COLORS.tinta;
    c.font = `500 ${bug.fontSize}px ${fonts.mono}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(bug.def.text, bug.x, bug.y + 0.5);
    c.globalAlpha = 1;
  }

  function drawAxolotl(c: CanvasRenderingContext2D, a: Axolotl) {
    const sprite = getSprite(a.stack, a.accessory);
    const bob = reduced
      ? 0
      : SWIM_BOB_AMPLITUDE * Math.sin(state.elapsed * SWIM_BOB_HZ * Math.PI * 2 + a.bobPhase);
    const amp = reduced ? SWIM_AMPLITUDE_REDUCED : SWIM_AMPLITUDE;

    c.save();
    c.translate(a.x, a.y + bob);
    c.scale(a.dir, 1);
    if (sprite) {
      const srcStrip = RASTER_W / SWIM_STRIPS;
      const dstStrip = SPRITE_W / SWIM_STRIPS;
      for (let i = 0; i < SWIM_STRIPS; i++) {
        // i = 0 es la cola (izquierda del sprite); la amplitud crece hacia ella.
        const stripAmp = amp * (1 - i / (SWIM_STRIPS - 1));
        const dy = stripAmp * Math.sin(a.swimPhase - SWIM_WAVE_K * i);
        c.drawImage(
          sprite,
          i * srcStrip,
          0,
          srcStrip,
          RASTER_H,
          -SPRITE_W / 2 + i * dstStrip,
          -SPRITE_H / 2 + dy,
          dstStrip + 0.6,
          SPRITE_H,
        );
      }
    } else {
      // Respaldo mientras llega el raster
      c.fillStyle = paletteFor(a.stack).piel;
      c.strokeStyle = COLORS.tinta;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, SPRITE_W / 2 - 2, SPRITE_H / 2 - 2, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    c.restore();

    drawLabel(c, a);
  }

  function drawLabel(c: CanvasRenderingContext2D, a: Axolotl) {
    const y = a.y - SPRITE_H / 2 - LABEL_GAP;
    c.font = `600 ${LABEL_FONT}px ${fonts.ui}`;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";

    if (a.kind === "bot") {
      // Nombre + pastilla "bot"
      const nameW = c.measureText(a.name).width;
      const pillText = "bot";
      const pillW = c.measureText(pillText).width + 8;
      const total = nameW + 4 + pillW;
      const startX = a.x - total / 2;
      c.lineWidth = 3;
      c.strokeStyle = COLORS.aguaProfunda;
      c.textAlign = "left";
      c.strokeText(a.name, startX, y);
      c.fillStyle = COLORS.lirio;
      c.fillText(a.name, startX, y);
      const px = startX + nameW + 4;
      c.fillStyle = COLORS.lirio;
      c.beginPath();
      c.roundRect(px, y - LABEL_FONT + 1, pillW, LABEL_FONT + 2, 5);
      c.fill();
      c.fillStyle = COLORS.aguaProfunda;
      c.textAlign = "center";
      c.fillText(pillText, px + pillW / 2, y);
      return;
    }

    c.lineWidth = 3;
    c.strokeStyle = COLORS.aguaProfunda;
    c.strokeText(a.name, a.x, y);
    c.fillStyle = COLORS.trajinera;
    c.fillText(a.name, a.x, y);
  }

  function drawHud(c: CanvasRenderingContext2D) {
    c.textBaseline = "top";

    // Puntos
    c.font = `600 ${HUD_FONT}px ${fonts.ui}`;
    c.textAlign = "left";
    hudText(c, `${player.score} pts`, HUD_PAD, HUD_PAD + 6);

    // Tiempo
    const remaining = Math.max(0, Math.ceil(ROUND_SECONDS - state.elapsed));
    const mm = Math.floor(remaining / 60);
    const ss = String(remaining % 60).padStart(2, "0");
    c.font = `600 ${HUD_TIME_FONT}px ${fonts.ui}`;
    c.textAlign = "center";
    hudText(c, `${mm}:${ss}`, WORLD_W / 2, HUD_PAD);

    // Lugar
    c.font = `600 ${HUD_FONT}px ${fonts.ui}`;
    c.textAlign = "right";
    hudText(c, `${playerPlace(player, state.axolotls)}.º`, WORLD_W - HUD_PAD, HUD_PAD + 6);

    if (state.paused) {
      c.font = `600 ${HUD_FONT}px ${fonts.ui}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      hudText(c, "En pausa", WORLD_W / 2, WORLD_H / 2);
    }
  }

  function hudText(c: CanvasRenderingContext2D, text: string, x: number, y: number) {
    c.lineWidth = 4;
    c.lineJoin = "round";
    c.strokeStyle = COLORS.aguaProfunda;
    c.strokeText(text, x, y);
    c.fillStyle = COLORS.lirio;
    c.fillText(text, x, y);
  }

  rafId = requestAnimationFrame(frame);

  return {
    stop() {
      if (!stopped) teardown();
    },
  };
}

function createDecor(): DecorBubble[] {
  const out: DecorBubble[] = [];
  for (let i = 0; i < DECOR_BUBBLES; i++) {
    out.push({
      x: Math.random() * WORLD_W,
      y: Math.random() * WORLD_H,
      r: 2 + Math.random() * 4,
      speed: DECOR_BUBBLE_SPEED * (0.6 + Math.random() * 0.8),
    });
  }
  return out;
}
