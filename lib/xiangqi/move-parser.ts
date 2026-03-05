import type { XiangqiParsedMove } from "./types";

function parseJSON(text: string): unknown | null {
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
    return value
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join("；")
      .slice(0, 420);
  }
  return cleanText(value).slice(0, 420);
}

function parseCoordPair(value: unknown): { row: number; col: number } | null {
  if (Array.isArray(value) && value.length >= 2) {
    const row = Number(value[0]);
    const col = Number(value[1]);
    if (Number.isInteger(row) && Number.isInteger(col)) {
      return { row, col };
    }
  }

  if (value && typeof value === "object") {
    const obj = value as { row?: unknown; col?: unknown };
    const row = Number(obj.row);
    const col = Number(obj.col);
    if (Number.isInteger(row) && Number.isInteger(col)) {
      return { row, col };
    }
  }

  if (typeof value === "string") {
    const match = value.match(/^\s*(\d+)\s*[,，]\s*(\d+)\s*$/);
    if (match) {
      const row = Number(match[1]);
      const col = Number(match[2]);
      if (Number.isInteger(row) && Number.isInteger(col)) {
        return { row, col };
      }
    }
  }

  return null;
}

export function parseXiangqiMoveFromLLMText(rawText: string): XiangqiParsedMove | null {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");

  const direct = parseJSON(cleaned);
  const source = direct || parseJSON(cleaned.match(/\{[\s\S]*\}/)?.[0] || "");
  if (!source || typeof source !== "object") {
    return null;
  }

  const payload = source as {
    fromRow?: unknown;
    fromCol?: unknown;
    toRow?: unknown;
    toCol?: unknown;
    from?: unknown;
    to?: unknown;
    reason?: unknown;
    thinking?: unknown;
  };

  const numericFromRow = Number(payload.fromRow);
  const numericFromCol = Number(payload.fromCol);
  const numericToRow = Number(payload.toRow);
  const numericToCol = Number(payload.toCol);

  let fromRow = numericFromRow;
  let fromCol = numericFromCol;
  let toRow = numericToRow;
  let toCol = numericToCol;

  if (
    !Number.isInteger(fromRow) ||
    !Number.isInteger(fromCol) ||
    !Number.isInteger(toRow) ||
    !Number.isInteger(toCol)
  ) {
    const fromPair = parseCoordPair(payload.from);
    const toPair = parseCoordPair(payload.to);
    if (!fromPair || !toPair) {
      return null;
    }

    fromRow = fromPair.row;
    fromCol = fromPair.col;
    toRow = toPair.row;
    toCol = toPair.col;
  }

  return {
    fromRow,
    fromCol,
    toRow,
    toCol,
    reason: cleanText(payload.reason).slice(0, 120),
    thinking: normalizeThinking(payload.thinking),
  };
}
