import type { XiangqiCandidateMove, XiangqiMove } from "./types";

export function pickXiangqiFallbackMove(candidates: XiangqiCandidateMove[]): XiangqiMove | null {
  if (candidates.length === 0) {
    return null;
  }

  const top = candidates[0];
  return {
    fromRow: top.fromRow,
    fromCol: top.fromCol,
    toRow: top.toRow,
    toCol: top.toCol,
  };
}
