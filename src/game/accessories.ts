import type { AccessoryId } from "./types";

export type AnchorName = "cabeza" | "ojos";

/** Anclas en unidades del viewBox 200×100 del ajolote base (DESIGN.md §5.1). */
export const ACCESSORY_ANCHORS: Record<AnchorName, { x: number; y: number }> = {
  cabeza: { x: 152, y: 24 },
  ojos: { x: 171, y: 44 },
};

export interface AccessoryDef {
  id: Exclude<AccessoryId, "none">;
  label: string;
  anchor: AnchorName;
  priority: "P0" | "P1";
}

export const ACCESSORIES: Record<Exclude<AccessoryId, "none">, AccessoryDef> = {
  charro: { id: "charro", label: "Sombrero de charro", anchor: "cabeza", priority: "P0" },
  sunglasses: { id: "sunglasses", label: "Lentes de sol", anchor: "ojos", priority: "P0" },
  wizard: { id: "wizard", label: "Gorro de mago", anchor: "cabeza", priority: "P1" },
  hardhat: { id: "hardhat", label: "Casco de obra", anchor: "cabeza", priority: "P1" },
  headphones: { id: "headphones", label: "Audífonos", anchor: "cabeza", priority: "P1" },
  crown: { id: "crown", label: "Corona", anchor: "cabeza", priority: "P1" },
};

export const NONE_LABEL = "Ninguno";

/** Accesorios que ya tienen SVG y se ofrecen en el camerino. */
export const AVAILABLE_ACCESSORIES: readonly AccessoryId[] = ["none", "charro", "sunglasses"];

export function accessoryLabel(id: AccessoryId): string {
  return id === "none" ? NONE_LABEL : ACCESSORIES[id].label;
}

export function accessorySvgPath(id: Exclude<AccessoryId, "none">): string {
  return `/sprites/accessories/${id}.svg`;
}
