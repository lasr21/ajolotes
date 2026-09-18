"use client";

import { useEffect, useRef } from "react";
import { startRound } from "@/game/engine";
import type { PlayerConfig, RoundStats } from "@/game/types";

interface Props {
  config: PlayerConfig;
  onEnd: (stats: RoundStats) => void;
}

/**
 * Monta el canvas, arranca el engine y entrega `RoundStats` una sola vez.
 * No guarda nada de la ronda en estado de React.
 */
export default function GameScreen({ config, onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = startRound(canvas, config, (stats) => onEndRef.current(stats));
    return () => handle.stop();
  }, [config]);

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-agua-profunda">
      <div className="aspect-[9/16] w-full max-w-[calc(100dvh*9/16)]">
        <canvas
          ref={canvasRef}
          aria-label="Estanque. Mueve el dedo o el cursor para guiar a tu ajolote hacia los bugs."
          className="block h-full w-full touch-none select-none"
        />
      </div>
    </main>
  );
}
