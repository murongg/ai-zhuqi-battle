import type { ParsedLLMMove } from "./types";

function tryParseJSON(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeThinking(value: unknown): string {
  if (Array.isArray(value)) {
    const lines = value.map((item) => cleanText(item)).filter(Boolean);
    return lines.join("；").slice(0, 420);
  }

  return cleanText(value).slice(0, 420);
}

export function parseMoveFromLLMText(rawText: string): ParsedLLMMove | null {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");

  const direct = tryParseJSON(cleaned);
  const source = direct || tryParseJSON(cleaned.match(/\{[\s\S]*\}/)?.[0] || "");
  if (!source || typeof source !== "object") {
    return null;
  }

  const payload = source as { row?: unknown; col?: unknown; reason?: unknown; thinking?: unknown };
  const row = Number(payload.row);
  const col = Number(payload.col);

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }

  return {
    row,
    col,
    reason: cleanText(payload.reason).slice(0, 120),
    thinking: normalizeThinking(payload.thinking),
  };
}
