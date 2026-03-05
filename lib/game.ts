export const BOARD_SIZE = 15;
export const WIN_LENGTH = 5;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export type CellValue = typeof EMPTY | typeof BLACK | typeof WHITE;
export type Player = typeof BLACK | typeof WHITE;
export type Board = CellValue[][];

export interface Move {
  row: number;
  col: number;
}

export interface CandidateMove extends Move {
  score: number;
}

export interface CompactBoardText {
  black: string;
  white: string;
}

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY) as CellValue[]);
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice() as CellValue[]);
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function opponent(player: Player): Player {
  return player === BLACK ? WHITE : BLACK;
}

export function isLegalMove(board: Board, row: number, col: number): boolean {
  return inBounds(row, col) && board[row][col] === EMPTY;
}

export function applyMove(board: Board, row: number, col: number, player: Player): Board | null {
  if (!isLegalMove(board, row, col)) {
    return null;
  }

  const nextBoard = cloneBoard(board);
  nextBoard[row][col] = player;
  return nextBoard;
}

function countDirection(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player,
): number {
  let count = 0;
  let r = row + dr;
  let c = col + dc;

  while (inBounds(r, c) && board[r][c] === player) {
    count += 1;
    r += dr;
    c += dc;
  }

  return count;
}

export function checkWin(board: Board, row: number, col: number, player: Player): boolean {
  for (const [dr, dc] of DIRECTIONS) {
    const streak =
      1 +
      countDirection(board, row, col, dr, dc, player) +
      countDirection(board, row, col, -dr, -dc, player);

    if (streak >= WIN_LENGTH) {
      return true;
    }
  }

  return false;
}

export function isBoardFull(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === EMPTY) {
        return false;
      }
    }
  }

  return true;
}

function countStones(board: Board): number {
  let stones = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== EMPTY) {
        stones += 1;
      }
    }
  }

  return stones;
}

function analyzeLine(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player,
): { count: number; openEnds: number } {
  let count = 1;
  let openEnds = 0;

  let r = row + dr;
  let c = col + dc;
  while (inBounds(r, c) && board[r][c] === player) {
    count += 1;
    r += dr;
    c += dc;
  }
  if (inBounds(r, c) && board[r][c] === EMPTY) {
    openEnds += 1;
  }

  r = row - dr;
  c = col - dc;
  while (inBounds(r, c) && board[r][c] === player) {
    count += 1;
    r -= dr;
    c -= dc;
  }
  if (inBounds(r, c) && board[r][c] === EMPTY) {
    openEnds += 1;
  }

  return { count, openEnds };
}

function patternScore(count: number, openEnds: number): number {
  if (count >= 5) return 10_000_000;
  if (count === 4 && openEnds === 2) return 1_000_000;
  if (count === 4 && openEnds === 1) return 120_000;
  if (count === 3 && openEnds === 2) return 18_000;
  if (count === 3 && openEnds === 1) return 2_600;
  if (count === 2 && openEnds === 2) return 620;
  if (count === 2 && openEnds === 1) return 120;
  if (count === 1 && openEnds === 2) return 40;
  return 8;
}

function evaluatePoint(board: Board, row: number, col: number, player: Player): number {
  if (!isLegalMove(board, row, col)) {
    return -Infinity;
  }

  let total = 0;
  let doubleThreat = 0;

  for (const [dr, dc] of DIRECTIONS) {
    const line = analyzeLine(board, row, col, dr, dc, player);
    total += patternScore(line.count, line.openEnds);

    if (line.count >= 4 && line.openEnds >= 1) {
      total += 35_000;
    }

    if (line.count === 3 && line.openEnds === 2) {
      doubleThreat += 1;
    }
  }

  if (doubleThreat >= 2) {
    total += 20_000;
  }

  return total;
}

export function isWinningMove(board: Board, row: number, col: number, player: Player): boolean {
  if (!isLegalMove(board, row, col)) {
    return false;
  }

  board[row][col] = player;
  const won = checkWin(board, row, col, player);
  board[row][col] = EMPTY;
  return won;
}

export function generateCandidateMoves(board: Board, player: Player, limit = 12): CandidateMove[] {
  const center = Math.floor(BOARD_SIZE / 2);
  if (countStones(board) === 0) {
    return [{ row: center, col: center, score: 1_000_000 }];
  }

  const set = new Set<string>();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === EMPTY) {
        continue;
      }

      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          const nr = row + dr;
          const nc = col + dc;
          if (!isLegalMove(board, nr, nc)) {
            continue;
          }
          set.add(`${nr},${nc}`);
        }
      }
    }
  }

  const enemy = opponent(player);
  const candidates: CandidateMove[] = [];

  for (const key of set) {
    const [rowText, colText] = key.split(",");
    const row = Number(rowText);
    const col = Number(colText);

    const attack = evaluatePoint(board, row, col, player);
    const defense = evaluatePoint(board, row, col, enemy);
    const centerBias = (BOARD_SIZE - (Math.abs(row - center) + Math.abs(col - center))) * 12;

    candidates.push({
      row,
      col,
      score: attack * 1.18 + defense * 1.1 + centerBias,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

export function playerLabel(player: Player): string {
  return player === BLACK ? "黑方" : "白方";
}

export function boardToCompactText(board: Board): CompactBoardText {
  const black: string[] = [];
  const white: string[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === BLACK) {
        black.push(`(${row},${col})`);
      } else if (board[row][col] === WHITE) {
        white.push(`(${row},${col})`);
      }
    }
  }

  return {
    black: black.join(" "),
    white: white.join(" "),
  };
}
