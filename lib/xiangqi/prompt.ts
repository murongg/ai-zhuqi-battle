import { boardToMatrixText, sideLabel } from "./game";
import type { BuildXiangqiPromptParams } from "./types";

function formatMove(rowA: number, colA: number, rowB: number, colB: number): string {
  return `(${rowA},${colA})->(${rowB},${colB})`;
}

export function buildXiangqiMovePrompt(params: BuildXiangqiPromptParams): string {
  const { board, side, moveHistory, candidates } = params;
  const last = moveHistory[moveHistory.length - 1];
  const lastText = last
    ? `第${last.turn}手 ${sideLabel(last.side)} ${formatMove(
        last.fromRow,
        last.fromCol,
        last.toRow,
        last.toCol,
      )}`
    : "无";

  const candidateText = candidates.length
    ? candidates
        .slice(0, 18)
        .map((move) => `${formatMove(move.fromRow, move.fromCol, move.toRow, move.toCol)} score=${Math.round(move.score)}`)
        .join(" ")
    : "无可用合法走法";

  return [
    `回合更新：当前你执${sideLabel(side)}，第 ${moveHistory.length + 1} 手。`,
    "请只从候选走法中选择一手（除非候选为空）。",
    `上一手：${lastText}`,
    "棋盘矩阵（--为空；rb/rn/...是红方；bb/bn/...是黑方）：",
    boardToMatrixText(board),
    `候选走法：${candidateText}`,
    "只返回JSON。",
  ].join("\n");
}
