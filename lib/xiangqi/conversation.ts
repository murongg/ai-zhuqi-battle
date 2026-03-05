import { BLACK_SIDE, RED_SIDE, sideLabel } from "./game";
import type { ChatMessage, XiangqiConversations, XiangqiSide } from "./types";

export const XIANGQI_SYSTEM_PROMPT =
  "你是中国象棋引擎。必须仅输出JSON对象，禁止markdown、禁止额外说明、禁止自然语言前后缀。";

function roleBootstrap(side: XiangqiSide): ChatMessage {
  const self = sideLabel(side);
  const enemy = sideLabel(side === RED_SIDE ? BLACK_SIDE : RED_SIDE);
  return {
    role: "user",
    content: [
      `你在本局持续扮演${self}AI，对手是${enemy}。`,
      "这是同一局连续对话，每回合我会追加完整棋局上下文与候选走法。",
      "坐标格式是 row(0-9), col(0-8)，row=0 在黑方底线，row=9 在红方底线。",
      "严格返回 JSON：",
      '{"fromRow":9,"fromCol":0,"toRow":8,"toCol":0,"reason":"一句短理由","thinking":["步骤1","步骤2"]}',
    ].join("\n"),
  };
}

export function createInitialConversationFor(side: XiangqiSide): ChatMessage[] {
  return [
    {
      role: "system",
      content: XIANGQI_SYSTEM_PROMPT,
    },
    roleBootstrap(side),
  ];
}

export function createInitialConversations(): XiangqiConversations {
  return {
    red: createInitialConversationFor(RED_SIDE),
    black: createInitialConversationFor(BLACK_SIDE),
  };
}

export function sideToConversationKey(side: XiangqiSide): "red" | "black" {
  return side === RED_SIDE ? "red" : "black";
}
