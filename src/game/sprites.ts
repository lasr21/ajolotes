/**
 * Horneado y rasterizado del ajolote (DESIGN.md §5.3).
 *
 * `bakeAxolotlSvg` es pura y sin DOM: sirve igual en el cliente y en la
 * tarjeta OG. El resto del módulo solo corre en el navegador.
 */
import palettes from "@/data/palettes.json";
import { SPRITE_H, SPRITE_SCALE, SPRITE_W } from "./config";
import { ACCESSORIES, ACCESSORY_ANCHORS, accessorySvgPath } from "./accessories";
import type { AccessoryId, Palette, Stack } from "./types";

export const BASE_SVG_PATH = "/sprites/ajolote-base.svg";
export const OUTLINE_COLOR = "#2A1F2D";
export const OUTLINE_WIDTH = "4.5";

const PALETTES = palettes as Record<Stack, Palette>;

export function paletteFor(stack: Stack): Palette {
  return PALETTES[stack];
}

/**
 * Devuelve el SVG del ajolote con colores literales y, si aplica, el
 * accesorio insertado en su ancla. El resultado no usa variables CSS ni
 * `<style>`: las clases del base se convierten en atributos `fill`/`stroke`
 * para que el render de la tarjeta OG también lo entienda.
 *
 * `accessorySvg` es el archivo SVG del accesorio; se extrae su contenido.
 */
export function bakeAxolotlSvg(
  baseSvg: string,
  palette: Palette,
  accessory: AccessoryId,
  accessorySvg?: string | null,
): string {
  const fills: Record<string, string> = {
    piel: palette.piel,
    panza: palette.panza,
    branquia: palette.branquias,
  };
  const strokeAttrs = `stroke="${OUTLINE_COLOR}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"`;

  let svg = baseSvg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/class="([^"]+)"/g, (_match, classList: string) => {
      const attrs: string[] = [];
      for (const cls of classList.trim().split(/\s+/)) {
        if (cls in fills) attrs.push(`fill="${fills[cls]}"`);
        else if (cls === "trazo") attrs.push(strokeAttrs);
        else if (cls === "solo-trazo") attrs.push(`fill="none" ${strokeAttrs}`);
      }
      return attrs.join(" ");
    });

  // Por si el base llegara a traer variables sueltas fuera de las clases.
  const vars: Record<string, string> = {
    "--piel": palette.piel,
    "--panza": palette.panza,
    "--branquias": palette.branquias,
    "--contorno": OUTLINE_COLOR,
    "--grosor": `${OUTLINE_WIDTH}px`,
  };
  svg = svg.replace(/var\((--[a-z]+)\)/g, (_m, name: string) => vars[name] ?? "");

  if (accessory !== "none" && accessorySvg) {
    const anchor = ACCESSORY_ANCHORS[ACCESSORIES[accessory].anchor];
    const inner = extractSvgInner(accessorySvg);
    svg = svg.replace(
      /<\/svg>\s*$/,
      `<g id="accesorio" transform="translate(${anchor.x} ${anchor.y})">${inner}</g></svg>`,
    );
  }

  return svg.replace(/\n\s*\n/g, "\n");
}

/** Quita la etiqueta `<svg>` exterior y los comentarios; deja solo el dibujo. */
export function extractSvgInner(svg: string): string {
  return svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Carga en el cliente (una sola vez por archivo)

let basePromise: Promise<string> | null = null;
const accessoryPromises = new Map<AccessoryId, Promise<string>>();

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}: ${res.status}`);
  return res.text();
}

export function loadBaseSvg(): Promise<string> {
  basePromise ??= fetchText(BASE_SVG_PATH).catch((err: unknown) => {
    basePromise = null;
    throw err;
  });
  return basePromise;
}

export function loadAccessorySvg(id: AccessoryId): Promise<string | null> {
  if (id === "none") return Promise.resolve(null);
  let p = accessoryPromises.get(id);
  if (!p) {
    p = fetchText(accessorySvgPath(id)).catch((err: unknown) => {
      accessoryPromises.delete(id);
      throw err;
    });
    accessoryPromises.set(id, p);
  }
  return p;
}

/** Carga lo necesario y devuelve el SVG horneado para un stack y accesorio. */
export async function bakeSprite(stack: Stack, accessory: AccessoryId): Promise<string> {
  const [base, acc] = await Promise.all([loadBaseSvg(), loadAccessorySvg(accessory)]);
  return bakeAxolotlSvg(base, paletteFor(stack), accessory, acc);
}

// ---------------------------------------------------------------------------
// Rasterizado para el canvas, con caché por stack + accesorio

export type SpriteKey = `${Stack}:${AccessoryId}`;

export function spriteKey(stack: Stack, accessory: AccessoryId): SpriteKey {
  return `${stack}:${accessory}`;
}

const rasterCache = new Map<SpriteKey, HTMLCanvasElement>();
const rasterPending = new Map<SpriteKey, Promise<HTMLCanvasElement>>();

export const RASTER_W = SPRITE_W * SPRITE_SCALE;
export const RASTER_H = SPRITE_H * SPRITE_SCALE;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo rasterizar el sprite"));
    img.src = url;
  });
}

async function rasterize(svg: string): Promise<HTMLCanvasElement> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = RASTER_W;
    canvas.height = RASTER_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sin contexto 2D");
    ctx.drawImage(img, 0, 0, RASTER_W, RASTER_H);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Hornea y rasteriza; idempotente y con caché. Llamar desde el camerino. */
export function prepareSprite(stack: Stack, accessory: AccessoryId): Promise<HTMLCanvasElement> {
  const key = spriteKey(stack, accessory);
  const cached = rasterCache.get(key);
  if (cached) return Promise.resolve(cached);
  let pending = rasterPending.get(key);
  if (!pending) {
    pending = bakeSprite(stack, accessory)
      .then(rasterize)
      .then((canvas) => {
        rasterCache.set(key, canvas);
        return canvas;
      })
      .finally(() => rasterPending.delete(key));
    rasterPending.set(key, pending);
  }
  return pending;
}

export function prepareSprites(items: readonly { stack: Stack; accessory: AccessoryId }[]) {
  return Promise.all(items.map((it) => prepareSprite(it.stack, it.accessory)));
}

/** Lectura sincrónica desde la caché, para el loop del juego. */
export function getSprite(stack: Stack, accessory: AccessoryId): HTMLCanvasElement | undefined {
  return rasterCache.get(spriteKey(stack, accessory));
}
