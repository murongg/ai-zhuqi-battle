import type { LLMProxyPayload, LLMProxyResponse } from "./types";

export async function requestLLMCompletion(
  payload: LLMProxyPayload,
  signal: AbortSignal,
): Promise<LLMProxyResponse> {
  const response = await fetch("/api/llm/move", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  const data = (await response.json().catch(() => ({}))) as Partial<LLMProxyResponse> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || `LLM请求失败(${response.status})`);
  }

  if (typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("LLM返回文本为空");
  }

  return {
    text: data.text,
    model: data.model || payload.llm.model,
  };
}
