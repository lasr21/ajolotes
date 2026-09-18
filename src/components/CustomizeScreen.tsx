"use client";

import { useEffect } from "react";
import AxolotlPreview from "./AxolotlPreview";
import TrajineraTitle from "./TrajineraTitle";
import { AVAILABLE_ACCESSORIES, accessoryLabel } from "@/game/accessories";
import { paletteFor, prepareSprites } from "@/game/sprites";
import { STACKS, STACK_LABELS, type PlayerConfig } from "@/game/types";

interface Props {
  config: PlayerConfig;
  onChange: (config: PlayerConfig) => void;
  onPlay: () => void;
}

const optionBase =
  "min-h-11 rounded-2xl border-2 px-3 py-2 text-base font-semibold transition-colors";
const optionOff = "border-lirio/25 bg-agua-profunda text-lirio hover:border-lirio/60";
const optionOn = "border-trajinera bg-lirio text-tinta";

export default function CustomizeScreen({ config, onChange, onPlay }: Props) {
  // Calienta los sprites de los bots (todos los stacks, sin accesorio).
  useEffect(() => {
    void prepareSprites(STACKS.map((stack) => ({ stack, accessory: "none" as const }))).catch(
      () => {},
    );
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center px-4 pb-8 pt-6">
      <div className="flex w-full max-w-[390px] flex-col gap-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <TrajineraTitle />
          <p className="text-lg text-lirio/90">
            Tu ajolote contra los bugs de JavaScript. 20 segundos.
          </p>
        </header>

        <AxolotlPreview stack={config.stack} accessory={config.accessory} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-base font-semibold text-lirio">Tu stack</legend>
          <div className="grid grid-cols-4 gap-2">
            {STACKS.map((stack) => {
              const selected = stack === config.stack;
              return (
                <button
                  key={stack}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ ...config, stack })}
                  className={`${optionBase} flex items-center justify-center gap-1 px-2 ${
                    selected ? optionOn : optionOff
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block size-3 shrink-0 rounded-full border border-tinta/40"
                    style={{ backgroundColor: paletteFor(stack).piel }}
                  />
                  <span className="whitespace-nowrap text-sm">{STACK_LABELS[stack]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-base font-semibold text-lirio">Tu accesorio</legend>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ACCESSORIES.map((accessory) => {
              const selected = accessory === config.accessory;
              return (
                <button
                  key={accessory}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ ...config, accessory })}
                  className={`${optionBase} rounded-full px-4 ${selected ? optionOn : optionOff}`}
                >
                  {accessoryLabel(accessory)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={onPlay}
          className="min-h-14 w-full rounded-2xl bg-trajinera px-6 py-3 text-lg font-semibold text-tinta shadow-[0_4px_0_#09343C] transition-transform active:translate-y-0.5"
        >
          Jugar
        </button>
      </div>
    </main>
  );
}
