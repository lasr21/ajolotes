/**
 * POST /api/review (DESIGN.md §7). Nunca responde con error al cliente:
 * ante entrada inválida, timeout o fallo del modelo devuelve 200 con una
 * reseña de respaldo y `source: "fallback"`.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { fallbackReview, GENERIC_FALLBACK } from "@/lib/fallback";
import { buildReviewMessages, postprocessReview, SYSTEM_PROMPT } from "@/lib/review-prompt";
import { roundStatsSchema, stackSchema, type ValidatedRoundStats } from "@/lib/review-schema";

export const runtime = "nodejs";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_TIMEOUT_MS = 4000;
const MAX_OUTPUT_TOKENS = 150;

export interface ReviewResponse {
  review: string;
  source: "ai" | "fallback";
}

function respond(review: string, source: ReviewResponse["source"]) {
  return NextResponse.json<ReviewResponse>({ review, source }, { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = roundStatsSchema.safeParse(body);
  if (!parsed.success) {
    // Rescata al menos el stack para que el respaldo suene del color correcto.
    const stack = stackSchema.safeParse((body as { stack?: unknown } | null)?.stack);
    const base = stack.success ? { ...GENERIC_FALLBACK, stack: stack.data } : GENERIC_FALLBACK;
    return respond(fallbackReview(base), "fallback");
  }
  const stats = parsed.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return respond(fallbackReview(stats), "fallback");

  try {
    const review = await generateReview(stats, apiKey);
    if (!review) return respond(fallbackReview(stats), "fallback");
    return respond(review, "ai");
  } catch {
    // Timeout, red, 4xx/5xx del modelo: da igual, el demo sigue.
    return respond(fallbackReview(stats), "fallback");
  }
}

async function generateReview(stats: ValidatedRoundStats, apiKey: string): Promise<string> {
  const anthropic = createAnthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  const timeoutMs = Number(process.env.REVIEW_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  const result = await generateText({
    model: anthropic(model),
    system: SYSTEM_PROMPT,
    messages: buildReviewMessages(stats),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    // Con 4 s de presupuesto no hay tiempo para reintentos.
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(timeoutMs),
  });

  return postprocessReview(result.text);
}
