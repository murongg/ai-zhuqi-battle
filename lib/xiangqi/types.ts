export const XIANGQI_ROWS = 10;
export const XIANGQI_COLS = 9;

export type XiangqiSide = "red" | "black";
export type XiangqiPieceKind = "k" | "a" | "b" | "n" | "r" | "c" | "p";

export interface XiangqiPiece {
  side: XiangqiSide;
  kind: XiangqiPieceKind;
}

export type XiangqiBoard = Array<Array<XiangqiPiece | null>>;

export interface XiangqiMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export interface XiangqiCandidateMove extends XiangqiMove {
  score: number;
}

export interface XiangqiMoveResult {
  board: XiangqiBoard;
  captured: XiangqiPiece | null;
}

export interface XiangqiCompactBoardText {
  red: string;
  black: string;
}

export interface XiangqiMoveHistoryItem {
  turn: number;
  side: XiangqiSide;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  moveText: string;
  capturedText: string;
  reason: string;
  thinking: string;
  model: string;
}

export interface XiangqiMoveCommitMeta {
  reason?: string;
  thinking?: string;
  model?: string;
}

export interface XiangqiParsedMove extends XiangqiMove {
  reason: string;
  thinking: string;
}

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface XiangqiConversations {
  red: ChatMessage[];
  black: ChatMessage[];
}

export interface BuildXiangqiPromptParams {
  board: XiangqiBoard;
  side: XiangqiSide;
  moveHistory: XiangqiMoveHistoryItem[];
  candidates: XiangqiCandidateMove[];
}
