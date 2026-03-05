import { BOARD_SIZE, BLACK, EMPTY, WHITE, type Board, type Player } from "./game";

export const CANVAS_SIZE = 640;
const PADDING = 32;
const CELL = (CANVAS_SIZE - PADDING * 2) / (BOARD_SIZE - 1);

export interface BoardMove {
  row: number;
  col: number;
  player: Player;
}

function boardX(col: number): number {
  return PADDING + col * CELL;
}

function boardY(row: number): number {
  return PADDING + row * CELL;
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  lastMove: BoardMove | null,
): void {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  gradient.addColorStop(0, "#d9ab74");
  gradient.addColorStop(1, "#be8850");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = "#6f4f2d";
  ctx.lineWidth = 1;

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    const offset = PADDING + i * CELL;

    ctx.beginPath();
    ctx.moveTo(PADDING, offset);
    ctx.lineTo(CANVAS_SIZE - PADDING, offset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(offset, PADDING);
    ctx.lineTo(offset, CANVAS_SIZE - PADDING);
    ctx.stroke();
  }

  drawStarPoints(ctx);

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = board[row][col];
      if (value !== EMPTY) {
        drawStone(ctx, row, col, value);
      }
    }
  }

  if (lastMove) {
    drawLastMoveMarker(ctx, lastMove.row, lastMove.col, lastMove.player);
  }
}

function drawStarPoints(ctx: CanvasRenderingContext2D): void {
  const points = [3, 7, 11];
  ctx.fillStyle = "#5d3f1f";

  for (const row of points) {
    for (const col of points) {
      ctx.beginPath();
      ctx.arc(boardX(col), boardY(row), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStone(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  player: typeof BLACK | typeof WHITE,
): void {
  const x = boardX(col);
  const y = boardY(row);
  const radius = CELL * 0.44;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (player === BLACK) {
    const grad = ctx.createRadialGradient(x - 6, y - 6, radius * 0.25, x, y, radius);
    grad.addColorStop(0, "#555555");
    grad.addColorStop(1, "#101010");
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,0,0,0.38)";
    ctx.shadowBlur = 8;
  } else {
    const grad = ctx.createRadialGradient(x - 7, y - 7, radius * 0.2, x, y, radius);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#d6d6d6");
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 6;
  }

  ctx.fill();
  ctx.restore();

  if (player === WHITE) {
    ctx.strokeStyle = "rgba(70, 70, 70, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLastMoveMarker(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  player: Player,
): void {
  const x = boardX(col);
  const y = boardY(row);
  ctx.strokeStyle = player === BLACK ? "#ffd88d" : "#ff7f3f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, CELL * 0.18, 0, Math.PI * 2);
  ctx.stroke();
}
