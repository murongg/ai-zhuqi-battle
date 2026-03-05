import type { CandidateMove, Player } from "../game";
import type { Board } from "../game";

export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_MODEL = "gpt-4.1-mini";

export interface SideConfigInput {
  apiUrl: string;
  model: string;
  apiKey: string;
}

export interface EffectiveSideConfig {
  model: string;
  ready: boolean;
}

export interface EffectiveConfig {
  black: EffectiveSideConfig;
  white: EffectiveSideConfig;
}

export interface MoveHistoryItem {
  turn: number;
  player: Player;
  row: number;
  col: number;
  reason: string;
  thinking: string;
  model: string;
}

export interface MoveCommitMeta {
  reason?: string;
  thinking?: string;
  model?: string;
}

export type AISide = "black" | "white";
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AIConversations {
  black: ChatMessage[];
  white: ChatMessage[];
}

export interface LLMProxyPayload {
  llm: {
    baseURL: string;
    model: string;
    apiKey: string;
    temperature: number;
  };
  messages: ChatMessage[];
}

export interface LLMProxyResponse {
  text: string;
  model: string;
}

export interface ParsedLLMMove {
  row: number;
  col: number;
  reason: string;
  thinking: string;
}

export interface BuildMovePromptParams {
  board: Board;
  player: Player;
  moveHistory: MoveHistoryItem[];
  candidateMoves: CandidateMove[];
}
