"use client";

import { useCallback, useState } from "react";
import CustomizeScreen from "@/components/CustomizeScreen";
import GameScreen from "@/components/GameScreen";
import type { PlayerConfig, RoundStats } from "@/game/types";

type Screen = "customize" | "playing" | "results";

const DEFAULT_CONFIG: PlayerConfig = { stack: "react", accessory: "none" };

export default function Home() {
  const [screen, setScreen] = useState<Screen>("customize");
  const [config, setConfig] = useState<PlayerConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<RoundStats | null>(null);

  const handleEnd = useCallback((s: RoundStats) => {
    setStats(s);
    setScreen("results");
  }, []);

  if (screen === "customize") {
    return (
      <CustomizeScreen config={config} onChange={setConfig} onPlay={() => setScreen("playing")} />
    );
  }

  if (screen === "playing") {
    return <GameScreen config={config} onEnd={handleEnd} />;
  }

  // Pantalla de resultados provisional; la definitiva llega en M5.
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-4xl font-semibold text-trajinera">{stats?.score ?? 0} pts</p>
      <p className="text-lg text-lirio/90">
        Quedaste en el lugar {stats?.place ?? 1} de {stats?.totalPlayers ?? 1}
      </p>
      <pre className="max-w-full overflow-auto rounded-2xl bg-agua-profunda p-4 text-left font-mono text-sm text-lirio/80">
        {JSON.stringify(stats, null, 2)}
      </pre>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setScreen("playing")}
          className="min-h-11 rounded-2xl bg-trajinera px-5 py-2 text-base font-semibold text-tinta"
        >
          Jugar otra vez
        </button>
        <button
          type="button"
          onClick={() => setScreen("customize")}
          className="min-h-11 rounded-2xl border-2 border-lirio/40 px-5 py-2 text-base font-semibold text-lirio"
        >
          Cambiar ajolote
        </button>
      </div>
    </main>
  );
}
