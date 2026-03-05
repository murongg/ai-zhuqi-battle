import { EMPTY, isLegalMove, type Board, type CandidateMove } from "../game";

export function pickFallbackMove(
  board: Board,
  candidates: CandidateMove[],
): { row: number; col: number } | null {
  for (const move of candidates) {
    if (isLegalMove(board, move.row, move.col)) {
      return { row: move.row, col: move.col };
    }
  }

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] === EMPTY) {
        return { row, col };
      }
    }
  }

  return null;
}
