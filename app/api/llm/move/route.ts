import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type CoreMessage } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_TEMPERATURE = 0.2;

interface ClientLLMInput {
  baseURL: string;
  apiKey: string;
  model: string;
  temperature?: number;
}

interface LLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      llm?: Partial<ClientLLMInput>;
      messages?: unknown;
    };

    const llmConfig = resolveLLMConfig(body.llm);
    if (!llmConfig) {
      return NextResponse.json(
        { error: "缺少 LLM 配置：请填写 API URL、Model、API Key。" },
        { status: 400 },
      );
    }

    const messages = normalizeMessages(body.messages);
    if (messages.length === 0) {
      return NextResponse.json({ error: "messages 不能为空" }, { status: 400 });
    }

    const provider = createOpenAI({
      apiKey: llmConfig.apiKey,
      baseURL: llmConfig.baseURL,
      compatibility: "compatible",
    });

    const result = await generateWithProtocolFallback(provider, llmConfig, messages);

    const text = result.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "LLM未返回文本内容" }, { status: 502 });
    }

    return NextResponse.json({
      text,
      model: llmConfig.model,
    });
  } catch (error) {
    return toAPIErrorResponse(error);
  }
}

async function generateWithProtocolFallback(
  provider: ReturnType<typeof createOpenAI>,
  llmConfig: LLMConfig,
  messages: CoreMessage[],
) {
  try {
    // Prefer Responses API first.
    return await generateText({
      model: provider.responses(llmConfig.model),
      messages,
      temperature: llmConfig.temperature,
    });
  } catch (firstError) {
    if (!shouldFallbackToChatCompletions(firstError)) {
      throw firstError;
    }

    // Fallback for providers (e.g. some OpenAI-compatible gateways) that only expose chat/completions.
    return await generateText({
      model: provider(llmConfig.model),
      messages,
      temperature: llmConfig.temperature,
    });
  }
}

function resolveLLMConfig(input: Partial<ClientLLMInput> | undefined): LLMConfig | null {
  const baseURL = normalizeBaseURL(input?.baseURL);
  const apiKey = cleanString(input?.apiKey);
  const model = cleanString(input?.model);

  if (!baseURL || !apiKey || !model) {
    return null;
  }

  const temperatureValue = typeof input?.temperature === "number" ? input.temperature : DEFAULT_TEMPERATURE;
  const temperature = Number.isFinite(temperatureValue) ? temperatureValue : DEFAULT_TEMPERATURE;

  return {
    baseURL,
    apiKey,
    model,
    temperature,
  };
}

function normalizeMessages(value: unknown): CoreMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const messages: CoreMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const message = item as { role?: unknown; content?: unknown };
    const role = message.role;
    const content = cleanString(message.content);

    if ((role === "system" || role === "user" || role === "assistant") && content) {
      messages.push({ role, content });
    }
  }

  return messages;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBaseURL(value: unknown): string {
  const text = cleanString(value);
  if (!text) {
    return "";
  }

  return text
    .replace(/\/(chat\/completions|responses)\/?$/, "")
    .replace(/\/+$/, "");
}

function shouldFallbackToChatCompletions(error: unknown): boolean {
  const status = error && typeof error === "object" ? (error as { statusCode?: unknown }).statusCode : undefined;
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (status === 404 || status === 405 || status === 410) {
    return true;
  }

  if (message.includes("/responses") && message.includes("not found")) {
    return true;
  }

  if (message.includes("responses") && (message.includes("unsupported") || message.includes("not supported"))) {
    return true;
  }

  return false;
}

function toAPIErrorResponse(error: unknown) {
  const fallbackMessage = error instanceof Error ? error.message : "服务端异常";

  if (error && typeof error === "object") {
    const maybeStatus = (error as { statusCode?: unknown }).statusCode;
    if (typeof maybeStatus === "number" && Number.isInteger(maybeStatus)) {
      const status = Math.min(599, Math.max(400, maybeStatus));
      return NextResponse.json({ error: `LLM API错误(${status}): ${fallbackMessage}` }, { status });
    }
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
