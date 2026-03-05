import { BLACK, type Board } from "../game";
import type { BuildMovePromptParams } from "./types";

function toSideLabel(player: number): string {
  return player === BLACK ? "黑方" : "白方";
}

function formatBoardMatrix(board: Board): string {
  return board
    .map((row, index) => `${String(index).padStart(2, "0")}: ${row.join(" ")}`)
    .join("\n");
}

export function buildMovePrompt(params: BuildMovePromptParams): string {
  const { board, player, moveHistory, candidateMoves } = params;

  const lastMove = moveHistory[moveHistory.length - 1];
  const lastMoveText = lastMove
    ? `${lastMove.turn}手 ${toSideLabel(lastMove.player)} 在 (${lastMove.row},${lastMove.col})`
    : "无";

  const candidates = candidateMoves.length
    ? candidateMoves
        .map((item) => `(${item.row},${item.col},score:${Number.isFinite(item.score) ? item.score : 0})`)
        .join(" ")
    : "无";

  return [
    `回合更新：第 ${moveHistory.length + 1} 手，当前你执 ${toSideLabel(player)}。`,
    `上一手：${lastMoveText}`,
    "当前棋盘矩阵(0空 1黑 2白):",
    formatBoardMatrix(board),
    `候选落子(优先从此集合选择): ${candidates}`,
    "仅返回JSON。",
  ].join("\n");
}
