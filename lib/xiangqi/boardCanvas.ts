import {
  pieceLabel,
  RED_SIDE,
} from "./game";
import type { XiangqiBoard, XiangqiSide } from "./types";

export const XIANGQI_CANVAS_WIDTH = 664;
export const XIANGQI_CANVAS_HEIGHT = 756;

const BOARD_PADDING_X = 52;
const BOARD_PADDING_Y = 52;
const CELL = 70;
const RIVER_GAP = 22;

export interface XiangqiBoardMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  side: XiangqiSide;
}

function boardX(col: number): number {
  return BOARD_PADDING_X + col * CELL;
}

function boardY(row: number): number {
  if (row <= 4) {
    return BOARD_PADDING_Y + row * CELL;
  }
  return BOARD_PADDING_Y + row * CELL + RIVER_GAP;
}

export function drawXiangqiBoard(
  ctx: CanvasRenderingContext2D,
  board: XiangqiBoard,
  lastMove: XiangqiBoardMove | null,
): void {
  ctx.clearRect(0, 0, XIANGQI_CANVAS_WIDTH, XIANGQI_CANVAS_HEIGHT);

  const grad = ctx.createLinearGradient(0, 0, XIANGQI_CANVAS_WIDTH, XIANGQI_CANVAS_HEIGHT);
  grad.addColorStop(0, "#ead2a2");
  grad.addColorStop(1, "#d8b277");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, XIANGQI_CANVAS_WIDTH, XIANGQI_CANVAS_HEIGHT);

  drawGrid(ctx);
  drawRiverLabel(ctx);
  drawStarMarkers(ctx);
  drawPieces(ctx, board);
  if (lastMove) {
    drawMoveMarker(ctx, lastMove);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#6f4b22";
  ctx.lineWidth = 1.2;

  for (let row = 0; row <= 9; row += 1) {
    const y = boardY(row);
    ctx.beginPath();
    ctx.moveTo(boardX(0), y);
    ctx.lineTo(boardX(8), y);
    ctx.stroke();
  }

  for (let col = 0; col <= 8; col += 1) {
    const x = boardX(col);
    if (col === 0 || col === 8) {
      ctx.beginPath();
      ctx.moveTo(x, boardY(0));
      ctx.lineTo(x, boardY(9));
      ctx.stroke();
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(x, boardY(0));
    ctx.lineTo(x, boardY(4));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, boardY(5));
    ctx.lineTo(x, boardY(9));
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(boardX(3), boardY(0));
  ctx.lineTo(boardX(5), boardY(2));
  ctx.moveTo(boardX(5), boardY(0));
  ctx.lineTo(boardX(3), boardY(2));
  ctx.moveTo(boardX(3), boardY(7));
  ctx.lineTo(boardX(5), boardY(9));
  ctx.moveTo(boardX(5), boardY(7));
  ctx.lineTo(boardX(3), boardY(9));
  ctx.stroke();
}

function drawRiverLabel(ctx: CanvasRenderingContext2D): void {
  const midY = (boardY(4) + boardY(5)) / 2;
  ctx.fillStyle = "#7b5527";
  ctx.font = '600 34px "KaiTi", "STKaiti", "Songti SC", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("楚河", boardX(2), midY);
  ctx.fillText("汉界", boardX(6), midY);
}

function drawStarMarkers(ctx: CanvasRenderingContext2D): void {
  const points: Array<[number, number]> = [
    [2, 1],
    [2, 7],
    [7, 1],
    [7, 7],
    [3, 0],
    [3, 2],
    [3, 4],
    [3, 6],
    [3, 8],
    [6, 0],
    [6, 2],
    [6, 4],
    [6, 6],
    [6, 8],
  ];

  ctx.fillStyle = "#7a5527";
  for (const [row, col] of points) {
    ctx.beginPath();
    ctx.arc(boardX(col), boardY(row), 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPieces(ctx: CanvasRenderingContext2D, board: XiangqiBoard): void {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece) {
        continue;
      }

      const x = boardX(col);
      const y = boardY(row);
      const radius = CELL * 0.39;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      const body = ctx.createRadialGradient(x - 10, y - 10, radius * 0.15, x, y, radius);
      body.addColorStop(0, "#fff8ed");
      body.addColorStop(1, "#ead9bd");
      ctx.fillStyle = body;
      ctx.shadowColor = "rgba(39, 24, 12, 0.2)";
      ctx.shadowBlur = 6;
      ctx.fill();

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = piece.side === RED_SIDE ? "#9f2a1f" : "#1f2a35";
      ctx.stroke();

      ctx.fillStyle = piece.side === RED_SIDE ? "#b33224" : "#1f2a35";
      ctx.font = '700 32px "KaiTi", "STKaiti", "Songti SC", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const label = pieceLabel(piece);
      const metrics = ctx.measureText(label);
      const centeredY = y + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      ctx.fillText(label, x, centeredY);
      ctx.restore();
    }
  }
}

function drawMoveMarker(ctx: CanvasRenderingContext2D, move: XiangqiBoardMove): void {
  const fromX = boardX(move.fromCol);
  const fromY = boardY(move.fromRow);
  const toX = boardX(move.toCol);
  const toY = boardY(move.toRow);

  ctx.strokeStyle = move.side === RED_SIDE ? "#ec5b4a" : "#2f92d0";
  ctx.lineWidth = 2;

  for (const [x, y] of [
    [fromX, fromY],
    [toX, toY],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, y, CELL * 0.46, 0, Math.PI * 2);
    ctx.stroke();
  }
}
