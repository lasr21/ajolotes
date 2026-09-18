"use client";

import { useState } from "react";
import CustomizeScreen from "@/components/CustomizeScreen";
import type { PlayerConfig } from "@/game/types";

type Screen = "customize" | "playing" | "results";

const DEFAULT_CONFIG: PlayerConfig = { stack: "react", accessory: "none" };

export default function Home() {
  const [screen, setScreen] = useState<Screen>("customize");
  const [config, setConfig] = useState<PlayerConfig>(DEFAULT_CONFIG);

  if (screen === "customize") {
    return (
      <CustomizeScreen config={config} onChange={setConfig} onPlay={() => setScreen("playing")} />
    );
  }

  // Estanque y resultados llegan en M2 y M5.
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-lg text-lirio/90">El estanque todavía está en construcción.</p>
      <button
        type="button"
        onClick={() => setScreen("customize")}
        className="min-h-11 rounded-2xl border-2 border-lirio/40 px-5 py-2 text-base font-semibold text-lirio"
      >
        Cambiar ajolote
      </button>
    </main>
  );
}
