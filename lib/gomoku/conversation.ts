import { BLACK, WHITE, type Player } from "../game";
import type { AIConversations, AISide, ChatMessage } from "./types";

export const SYSTEM_PROMPT =
  "你是五子棋引擎。你必须返回JSON对象，不要markdown，不要解释，不要输出额外文本。";

function sideLabel(player: Player): string {
  return player === BLACK ? "黑方" : "白方";
}

function roleBootstrap(player: Player): ChatMessage {
  const self = sideLabel(player);
  const enemy = player === BLACK ? "白方" : "黑方";

  return {
    role: "user",
    content: [
      `你在本局中持续扮演${self}AI，对手是${enemy}。`,
      "这是同一局的连续对话，每个回合我会追加当前棋盘状态。",
      "你必须基于整局历史做决策，并严格返回JSON。",
      '{"row":7,"col":8,"reason":"一句简短原因","thinking":["步骤1","步骤2"]}',
    ].join("\n"),
  };
}

export function createInitialConversationFor(player: Player): ChatMessage[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    roleBootstrap(player),
  ];
}

export function createInitialConversations(): AIConversations {
  return {
    black: createInitialConversationFor(BLACK),
    white: createInitialConversationFor(WHITE),
  };
}

export function sideFromPlayer(player: Player): AISide {
  return player === BLACK ? "black" : "white";
}
