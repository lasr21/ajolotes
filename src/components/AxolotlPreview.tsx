"use client";

import { useEffect, useState } from "react";
import { bakeSprite, prepareSprite } from "@/game/sprites";
import type { AccessoryId, Stack } from "@/game/types";

interface Props {
  stack: Stack;
  accessory: AccessoryId;
}

/**
 * Vista previa grande del ajolote sobre agua. El SVG horneado se inserta
 * inline: cambiar stack o accesorio lo actualiza sin parpadeo porque el
 * base ya está en memoria después de la primera carga.
 */
export default function AxolotlPreview({ stack, accessory }: Props) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    bakeSprite(stack, accessory)
      .then((baked) => {
        if (!cancelled) setSvg(baked);
      })
      .catch(() => {
        /* Sin sprite no hay vista previa; el juego sigue. */
      });
    // Deja listo el raster para que la ronda arranque sin cargas.
    void prepareSprite(stack, accessory).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stack, accessory]);

  return (
    <div
      aria-hidden="true"
      className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-3xl border-4 border-agua-profunda bg-agua-profunda/50"
    >
      <svg
        viewBox="0 0 360 176"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-40"
      >
        <path
          d="M-10 60 Q40 48 90 60 T190 60 T290 60 T390 60"
          fill="none"
          stroke="#EAF4EF"
          strokeWidth="2"
        />
        <path
          d="M-10 128 Q40 116 90 128 T190 128 T290 128 T390 128"
          fill="none"
          stroke="#EAF4EF"
          strokeWidth="2"
        />
      </svg>
      <div
        className="relative w-[280px] [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
    </div>
  );
}
