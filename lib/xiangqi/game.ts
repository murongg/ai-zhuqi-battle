import type {
  XiangqiBoard,
  XiangqiCandidateMove,
  XiangqiCompactBoardText,
  XiangqiMove,
  XiangqiMoveResult,
  XiangqiPiece,
  XiangqiPieceKind,
  XiangqiSide,
} from "./types";
import { XIANGQI_COLS, XIANGQI_ROWS } from "./types";

export const RED_SIDE: XiangqiSide = "red";
export const BLACK_SIDE: XiangqiSide = "black";

const PIECE_VALUES: Record<XiangqiPieceKind, number> = {
  k: 100000,
  r: 900,
  c: 500,
  n: 450,
  b: 240,
  a: 220,
  p: 120,
};

const ROOK_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const KNIGHT_PATTERNS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-2, -1, -1, 0],
  [-2, 1, -1, 0],
  [2, -1, 1, 0],
  [2, 1, 1, 0],
  [-1, -2, 0, -1],
  [1, -2, 0, -1],
  [-1, 2, 0, 1],
  [1, 2, 0, 1],
];

const BISHOP_PATTERNS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-2, -2, -1, -1],
  [-2, 2, -1, 1],
  [2, -2, 1, -1],
  [2, 2, 1, 1],
];

const ADVISOR_PATTERNS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function createInitialBoard(): XiangqiBoard {
  const board: XiangqiBoard = Array.from({ length: XIANGQI_ROWS }, () =>
    Array.from({ length: XIANGQI_COLS }, () => null as XiangqiPiece | null),
  );

  const put = (row: number, col: number, side: XiangqiSide, kind: XiangqiPieceKind) => {
    board[row][col] = { side, kind };
  };

  put(0, 0, BLACK_SIDE, "r");
  put(0, 1, BLACK_SIDE, "n");
  put(0, 2, BLACK_SIDE, "b");
  put(0, 3, BLACK_SIDE, "a");
  put(0, 4, BLACK_SIDE, "k");
  put(0, 5, BLACK_SIDE, "a");
  put(0, 6, BLACK_SIDE, "b");
  put(0, 7, BLACK_SIDE, "n");
  put(0, 8, BLACK_SIDE, "r");
  put(2, 1, BLACK_SIDE, "c");
  put(2, 7, BLACK_SIDE, "c");
  put(3, 0, BLACK_SIDE, "p");
  put(3, 2, BLACK_SIDE, "p");
  put(3, 4, BLACK_SIDE, "p");
  put(3, 6, BLACK_SIDE, "p");
  put(3, 8, BLACK_SIDE, "p");

  put(9, 0, RED_SIDE, "r");
  put(9, 1, RED_SIDE, "n");
  put(9, 2, RED_SIDE, "b");
  put(9, 3, RED_SIDE, "a");
  put(9, 4, RED_SIDE, "k");
  put(9, 5, RED_SIDE, "a");
  put(9, 6, RED_SIDE, "b");
  put(9, 7, RED_SIDE, "n");
  put(9, 8, RED_SIDE, "r");
  put(7, 1, RED_SIDE, "c");
  put(7, 7, RED_SIDE, "c");
  put(6, 0, RED_SIDE, "p");
  put(6, 2, RED_SIDE, "p");
  put(6, 4, RED_SIDE, "p");
  put(6, 6, RED_SIDE, "p");
  put(6, 8, RED_SIDE, "p");

  return board;
}

export function cloneBoard(board: XiangqiBoard): XiangqiBoard {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < XIANGQI_ROWS && col >= 0 && col < XIANGQI_COLS;
}

export function oppositeSide(side: XiangqiSide): XiangqiSide {
  return side === RED_SIDE ? BLACK_SIDE : RED_SIDE;
}

export function sideLabel(side: XiangqiSide): string {
  return side === RED_SIDE ? "红方" : "黑方";
}

export function pieceLabel(piece: XiangqiPiece): string {
  if (piece.side === RED_SIDE) {
    const redMap: Record<XiangqiPieceKind, string> = {
      k: "帅",
      a: "仕",
      b: "相",
      n: "马",
      r: "车",
      c: "炮",
      p: "兵",
    };
    return redMap[piece.kind];
  }

  const blackMap: Record<XiangqiPieceKind, string> = {
    k: "将",
    a: "士",
    b: "象",
    n: "马",
    r: "车",
    c: "炮",
    p: "卒",
  };
  return blackMap[piece.kind];
}

export function formatMoveText(piece: XiangqiPiece, move: XiangqiMove): string {
  return `${pieceLabel(piece)}(${move.fromRow},${move.fromCol})→(${move.toRow},${move.toCol})`;
}

function insidePalace(side: XiangqiSide, row: number, col: number): boolean {
  if (col < 3 || col > 5) {
    return false;
  }

  if (side === RED_SIDE) {
    return row >= 7 && row <= 9;
  }

  return row >= 0 && row <= 2;
}

function crossedRiver(side: XiangqiSide, row: number): boolean {
  return side === RED_SIDE ? row <= 4 : row >= 5;
}

function canOccupy(board: XiangqiBoard, row: number, col: number, side: XiangqiSide): boolean {
  if (!inBounds(row, col)) {
    return false;
  }
  const target = board[row][col];
  return !target || target.side !== side;
}

function isSameMove(a: XiangqiMove, b: XiangqiMove): boolean {
  return (
    a.fromRow === b.fromRow &&
    a.fromCol === b.fromCol &&
    a.toRow === b.toRow &&
    a.toCol === b.toCol
  );
}

export function generatePseudoMovesForPiece(
  board: XiangqiBoard,
  row: number,
  col: number,
  piece: XiangqiPiece,
): XiangqiMove[] {
  const moves: XiangqiMove[] = [];

  if (piece.kind === "r") {
    for (const [dr, dc] of ROOK_DIRS) {
      let r = row + dr;
      let c = col + dc;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
        } else {
          if (target.side !== piece.side) {
            moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  } else if (piece.kind === "c") {
    for (const [dr, dc] of ROOK_DIRS) {
      let r = row + dr;
      let c = col + dc;
      let screened = false;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (!screened) {
          if (!target) {
            moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
          } else {
            screened = true;
          }
        } else if (target) {
          if (target.side !== piece.side) {
            moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  } else if (piece.kind === "n") {
    for (const [dr, dc, lr, lc] of KNIGHT_PATTERNS) {
      const legRow = row + lr;
      const legCol = col + lc;
      if (!inBounds(legRow, legCol) || board[legRow][legCol]) {
        continue;
      }

      const toRow = row + dr;
      const toCol = col + dc;
      if (!canOccupy(board, toRow, toCol, piece.side)) {
        continue;
      }

      moves.push({ fromRow: row, fromCol: col, toRow, toCol });
    }
  } else if (piece.kind === "b") {
    for (const [dr, dc, er, ec] of BISHOP_PATTERNS) {
      const eyeRow = row + er;
      const eyeCol = col + ec;
      if (!inBounds(eyeRow, eyeCol) || board[eyeRow][eyeCol]) {
        continue;
      }

      const toRow = row + dr;
      const toCol = col + dc;
      if (!inBounds(toRow, toCol)) {
        continue;
      }

      if (piece.side === RED_SIDE && toRow <= 4) {
        continue;
      }
      if (piece.side === BLACK_SIDE && toRow >= 5) {
        continue;
      }

      if (!canOccupy(board, toRow, toCol, piece.side)) {
        continue;
      }

      moves.push({ fromRow: row, fromCol: col, toRow, toCol });
    }
  } else if (piece.kind === "a") {
    for (const [dr, dc] of ADVISOR_PATTERNS) {
      const toRow = row + dr;
      const toCol = col + dc;
      if (!insidePalace(piece.side, toRow, toCol)) {
        continue;
      }
      if (!canOccupy(board, toRow, toCol, piece.side)) {
        continue;
      }
      moves.push({ fromRow: row, fromCol: col, toRow, toCol });
    }
  } else if (piece.kind === "k") {
    for (const [dr, dc] of ROOK_DIRS) {
      const toRow = row + dr;
      const toCol = col + dc;
      if (!insidePalace(piece.side, toRow, toCol)) {
        continue;
      }
      if (!canOccupy(board, toRow, toCol, piece.side)) {
        continue;
      }
      moves.push({ fromRow: row, fromCol: col, toRow, toCol });
    }

    const dir = piece.side === RED_SIDE ? -1 : 1;
    let r = row + dir;
    while (inBounds(r, col)) {
      const target = board[r][col];
      if (target) {
        if (target.side !== piece.side && target.kind === "k") {
          moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: col });
        }
        break;
      }
      r += dir;
    }
  } else if (piece.kind === "p") {
    const forward = piece.side === RED_SIDE ? -1 : 1;
    const toRow = row + forward;
    if (canOccupy(board, toRow, col, piece.side)) {
      moves.push({ fromRow: row, fromCol: col, toRow, toCol: col });
    }

    if (crossedRiver(piece.side, row)) {
      for (const dc of [-1, 1] as const) {
        const toCol = col + dc;
        if (canOccupy(board, row, toCol, piece.side)) {
          moves.push({ fromRow: row, fromCol: col, toRow: row, toCol });
        }
      }
    }
  }

  return moves;
}

function findKing(board: XiangqiBoard, side: XiangqiSide): { row: number; col: number } | null {
  for (let row = 0; row < XIANGQI_ROWS; row += 1) {
    for (let col = 0; col < XIANGQI_COLS; col += 1) {
      const piece = board[row][col];
      if (piece && piece.side === side && piece.kind === "k") {
        return { row, col };
      }
    }
  }
  return null;
}

function isSquareAttacked(
  board: XiangqiBoard,
  targetRow: number,
  targetCol: number,
  attacker: XiangqiSide,
): boolean {
  for (let row = 0; row < XIANGQI_ROWS; row += 1) {
    for (let col = 0; col < XIANGQI_COLS; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.side !== attacker) {
        continue;
      }
      const pseudo = generatePseudoMovesForPiece(board, row, col, piece);
      if (pseudo.some((move) => move.toRow === targetRow && move.toCol === targetCol)) {
        return true;
      }
    }
  }
  return false;
}

export function isInCheck(board: XiangqiBoard, side: XiangqiSide): boolean {
  const king = findKing(board, side);
  if (!king) {
    return true;
  }
  return isSquareAttacked(board, king.row, king.col, oppositeSide(side));
}

function applyMoveUnchecked(board: XiangqiBoard, move: XiangqiMove): XiangqiMoveResult | null {
  if (!inBounds(move.fromRow, move.fromCol) || !inBounds(move.toRow, move.toCol)) {
    return null;
  }

  const piece = board[move.fromRow][move.fromCol];
  if (!piece) {
    return null;
  }

  const next = cloneBoard(board);
  const captured = next[move.toRow][move.toCol];
  next[move.toRow][move.toCol] = { ...piece };
  next[move.fromRow][move.fromCol] = null;

  return {
    board: next,
    captured: captured ? { ...captured } : null,
  };
}

export function isLegalMove(board: XiangqiBoard, move: XiangqiMove, side: XiangqiSide): boolean {
  if (!inBounds(move.fromRow, move.fromCol) || !inBounds(move.toRow, move.toCol)) {
    return false;
  }

  const piece = board[move.fromRow][move.fromCol];
  if (!piece || piece.side !== side) {
    return false;
  }

  const pseudo = generatePseudoMovesForPiece(board, move.fromRow, move.fromCol, piece);
  if (!pseudo.some((m) => isSameMove(m, move))) {
    return false;
  }

  const result = applyMoveUnchecked(board, move);
  if (!result) {
    return false;
  }

  return !isInCheck(result.board, side);
}

export function applyMove(
  board: XiangqiBoard,
  move: XiangqiMove,
  side: XiangqiSide,
): XiangqiMoveResult | null {
  if (!isLegalMove(board, move, side)) {
    return null;
  }
  return applyMoveUnchecked(board, move);
}

export function generateLegalMoves(board: XiangqiBoard, side: XiangqiSide): XiangqiMove[] {
  const moves: XiangqiMove[] = [];

  for (let row = 0; row < XIANGQI_ROWS; row += 1) {
    for (let col = 0; col < XIANGQI_COLS; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.side !== side) {
        continue;
      }

      const pseudo = generatePseudoMovesForPiece(board, row, col, piece);
      for (const move of pseudo) {
        if (isLegalMove(board, move, side)) {
          moves.push(move);
        }
      }
    }
  }

  return moves;
}

function evaluateMove(board: XiangqiBoard, move: XiangqiMove, side: XiangqiSide): number {
  const movingPiece = board[move.fromRow][move.fromCol];
  if (!movingPiece) {
    return -Infinity;
  }

  const result = applyMoveUnchecked(board, move);
  if (!result) {
    return -Infinity;
  }

  const capturedValue = result.captured ? PIECE_VALUES[result.captured.kind] : 0;
  const captureBonus = capturedValue * 3.4;

  let mobilityBonus = 0;
  if (movingPiece.kind === "r" || movingPiece.kind === "c") {
    mobilityBonus += (4 - Math.abs(move.toCol - 4)) * 16;
  } else if (movingPiece.kind === "n") {
    mobilityBonus += (4 - Math.abs(move.toCol - 4)) * 10;
  } else if (movingPiece.kind === "p") {
    const progress = side === RED_SIDE ? 9 - move.toRow : move.toRow;
    mobilityBonus += progress * 12;
  }

  let checkBonus = 0;
  if (isInCheck(result.board, oppositeSide(side))) {
    checkBonus += 180;
  }

  if (result.captured?.kind === "k") {
    checkBonus += 1_000_000;
  }

  return captureBonus + mobilityBonus + checkBonus;
}

export function generateCandidateMoves(
  board: XiangqiBoard,
  side: XiangqiSide,
  limit = 24,
): XiangqiCandidateMove[] {
  const legal = generateLegalMoves(board, side);
  const scored = legal.map((move) => ({
    ...move,
    score: evaluateMove(board, move, side),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export function resolveWinner(board: XiangqiBoard, sideToMove: XiangqiSide): XiangqiSide | null {
  const redKing = findKing(board, RED_SIDE);
  const blackKing = findKing(board, BLACK_SIDE);

  if (!redKing) {
    return BLACK_SIDE;
  }
  if (!blackKing) {
    return RED_SIDE;
  }

  const legal = generateLegalMoves(board, sideToMove);
  if (legal.length === 0) {
    return oppositeSide(sideToMove);
  }

  return null;
}

export function boardToMatrixText(board: XiangqiBoard): string {
  return board
    .map((row, rowIndex) => {
      const text = row
        .map((piece) => {
          if (!piece) {
            return "--";
          }
          return `${piece.side === RED_SIDE ? "r" : "b"}${piece.kind}`;
        })
        .join(" ");
      return `${String(rowIndex).padStart(2, "0")}: ${text}`;
    })
    .join("\n");
}

export function boardToCompactText(board: XiangqiBoard): XiangqiCompactBoardText {
  const red: string[] = [];
  const black: string[] = [];

  for (let row = 0; row < XIANGQI_ROWS; row += 1) {
    for (let col = 0; col < XIANGQI_COLS; col += 1) {
      const piece = board[row][col];
      if (!piece) {
        continue;
      }
      const text = `${pieceLabel(piece)}(${row},${col})`;
      if (piece.side === RED_SIDE) {
        red.push(text);
      } else {
        black.push(text);
      }
    }
  }

  return {
    red: red.join(" "),
    black: black.join(" "),
  };
}
