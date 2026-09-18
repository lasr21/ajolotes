"use client";

import { useCallback, useState } from "react";
import CustomizeScreen from "@/components/CustomizeScreen";
import GameScreen from "@/components/GameScreen";
import { useReview } from "@/components/useReview";
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

  return <ProvisionalResults stats={stats} onReplay={() => setScreen("playing")} onCustomize={() => setScreen("customize")} />;
}

// Pantalla de resultados provisional; la definitiva llega en M5.
function ProvisionalResults({
  stats,
  onReplay,
  onCustomize,
}: {
  stats: RoundStats | null;
  onReplay: () => void;
  onCustomize: () => void;
}) {
  const review = useReview(stats);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-4xl font-semibold text-trajinera">{stats?.score ?? 0} pts</p>
      <p className="text-lg text-lirio/90">
        Quedaste en el lugar {stats?.place ?? 1} de {stats?.totalPlayers ?? 1}
      </p>
      <section className="w-full max-w-[390px] rounded-2xl bg-lirio p-4 text-left text-tinta">
        <h2 className="text-base font-semibold">Tu code review</h2>
        <p className="mt-2 text-base" data-source={review.source ?? undefined}>
          {review.loading ? "Revisando tu PR…" : review.review ?? "Sin reseña esta vez."}
        </p>
      </section>
      <pre className="max-w-full overflow-auto rounded-2xl bg-agua-profunda p-4 text-left font-mono text-sm text-lirio/80">
        {JSON.stringify(stats, null, 2)}
      </pre>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onReplay}
          className="min-h-11 rounded-2xl bg-trajinera px-5 py-2 text-base font-semibold text-tinta"
        >
          Jugar otra vez
        </button>
        <button
          type="button"
          onClick={onCustomize}
          className="min-h-11 rounded-2xl border-2 border-lirio/40 px-5 py-2 text-base font-semibold text-lirio"
        >
          Cambiar ajolote
        </button>
      </div>
    </main>
  );
}
