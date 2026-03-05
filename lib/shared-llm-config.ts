import { DEFAULT_BASE_URL, DEFAULT_MODEL, type SideConfigInput } from "./gomoku/types";

export type SharedLLMSide = "black" | "white";

const SHARED_LLM_STORAGE_KEYS: Record<
  SharedLLMSide,
  { apiUrl: string; model: string; apiKey: string }
> = {
  black: {
    apiUrl: "llm:shared:black:api-url",
    model: "llm:shared:black:model",
    apiKey: "llm:shared:black:api-key",
  },
  white: {
    apiUrl: "llm:shared:white:api-url",
    model: "llm:shared:white:model",
    apiKey: "llm:shared:white:api-key",
  },
};

const LEGACY_GLOBAL_KEYS = {
  apiUrl: "llm:shared-api-url",
  model: "llm:shared-model",
  apiKey: "llm:shared-api-key",
} as const;

function readText(key: string): string {
  try {
    return window.localStorage.getItem(key)?.trim() || "";
  } catch {
    return "";
  }
}

export function readSharedLLMConfig(fallback?: Partial<SideConfigInput>): SideConfigInput {
  const apiUrl = readText(LEGACY_GLOBAL_KEYS.apiUrl) || fallback?.apiUrl?.trim() || DEFAULT_BASE_URL;
  const model = readText(LEGACY_GLOBAL_KEYS.model) || fallback?.model?.trim() || DEFAULT_MODEL;
  const apiKey = readText(LEGACY_GLOBAL_KEYS.apiKey) || fallback?.apiKey || "";

  return {
    apiUrl,
    model,
    apiKey,
  };
}

export function writeSharedLLMConfig(config: SideConfigInput): void {
  try {
    window.localStorage.setItem(LEGACY_GLOBAL_KEYS.apiUrl, config.apiUrl);
    window.localStorage.setItem(LEGACY_GLOBAL_KEYS.model, config.model);
    window.localStorage.setItem(LEGACY_GLOBAL_KEYS.apiKey, config.apiKey);
  } catch {
    // Ignore browser storage errors.
  }
}

export function readSharedLLMConfigBySide(
  side: SharedLLMSide,
  fallback?: Partial<SideConfigInput>,
): SideConfigInput {
  const keys = SHARED_LLM_STORAGE_KEYS[side];
  const legacy = readSharedLLMConfig();

  const apiUrl = readText(keys.apiUrl) || fallback?.apiUrl?.trim() || legacy.apiUrl || DEFAULT_BASE_URL;
  const model = readText(keys.model) || fallback?.model?.trim() || legacy.model || DEFAULT_MODEL;
  const apiKey = readText(keys.apiKey) || fallback?.apiKey || legacy.apiKey || "";

  return { apiUrl, model, apiKey };
}

export function writeSharedLLMConfigBySide(side: SharedLLMSide, config: SideConfigInput): void {
  const keys = SHARED_LLM_STORAGE_KEYS[side];
  try {
    window.localStorage.setItem(keys.apiUrl, config.apiUrl);
    window.localStorage.setItem(keys.model, config.model);
    window.localStorage.setItem(keys.apiKey, config.apiKey);
  } catch {
    // Ignore browser storage errors.
  }
}
