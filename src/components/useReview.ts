"use client";

import { useEffect, useState } from "react";
import type { ReviewResponse } from "@/app/api/review/route";
import type { RoundStats } from "@/game/types";

export interface ReviewState {
  review: string | null;
  source: ReviewResponse["source"] | null;
  loading: boolean;
}

interface Result {
  /** Las estadísticas a las que corresponde esta respuesta. */
  forStats: RoundStats;
  data: ReviewResponse | null;
}

/**
 * Pide el code review a /api/review una vez por ronda. La ruta nunca falla,
 * pero si la red se cae de plano se queda sin reseña y la UI lo tolera.
 */
export function useReview(stats: RoundStats | null): ReviewState {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!stats) return;
    let cancelled = false;

    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stats),
    })
      .then((res) => res.json() as Promise<ReviewResponse>)
      .then((data) => {
        if (!cancelled) setResult({ forStats: stats, data });
      })
      .catch(() => {
        if (!cancelled) setResult({ forStats: stats, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [stats]);

  const current = stats && result?.forStats === stats ? result : null;
  return {
    review: current?.data?.review ?? null,
    source: current?.data?.source ?? null,
    loading: stats !== null && current === null,
  };
}
