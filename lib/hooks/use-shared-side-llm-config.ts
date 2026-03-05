import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { DEFAULT_BASE_URL, DEFAULT_MODEL, type SideConfigInput } from "../gomoku/types";
import { readSharedLLMConfigBySide, writeSharedLLMConfigBySide } from "../shared-llm-config";

interface UseSharedSideLLMConfigParams {
  blackStorageKey: string;
  whiteStorageKey: string;
}

interface UseSharedSideLLMConfigResult {
  blackConfig: SideConfigInput;
  whiteConfig: SideConfigInput;
  setBlackConfig: Dispatch<SetStateAction<SideConfigInput>>;
  setWhiteConfig: Dispatch<SetStateAction<SideConfigInput>>;
  hydrated: boolean;
}

const EMPTY_SIDE_CONFIG: SideConfigInput = {
  apiUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
  apiKey: "",
};

function normalizeSideConfig(value: unknown): SideConfigInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as { apiUrl?: unknown; model?: unknown; apiKey?: unknown };
  return {
    apiUrl: typeof input.apiUrl === "string" ? input.apiUrl : DEFAULT_BASE_URL,
    model: typeof input.model === "string" ? input.model : DEFAULT_MODEL,
    apiKey: typeof input.apiKey === "string" ? input.apiKey : "",
  };
}

function readStoredConfig(storageKey: string): SideConfigInput | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return normalizeSideConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeStoredConfig(storageKey: string, config: SideConfigInput): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(config));
  } catch {
    // Ignore browser storage errors.
  }
}

export function useSharedSideLLMConfig(
  params: UseSharedSideLLMConfigParams,
): UseSharedSideLLMConfigResult {
  const [blackConfig, setBlackConfig] = useState<SideConfigInput>(EMPTY_SIDE_CONFIG);
  const [whiteConfig, setWhiteConfig] = useState<SideConfigInput>(EMPTY_SIDE_CONFIG);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    const storedBlack = readStoredConfig(params.blackStorageKey);
    const storedWhite = readStoredConfig(params.whiteStorageKey);

    const sharedBlack = readSharedLLMConfigBySide("black", storedBlack || undefined);
    const sharedWhite = readSharedLLMConfigBySide("white", storedWhite || undefined);

    setBlackConfig(sharedBlack);
    setWhiteConfig(sharedWhite);
    setHydrated(true);
  }, [params.blackStorageKey, params.whiteStorageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeSharedLLMConfigBySide("black", blackConfig);
    writeSharedLLMConfigBySide("white", whiteConfig);
    writeStoredConfig(params.blackStorageKey, blackConfig);
    writeStoredConfig(params.whiteStorageKey, whiteConfig);
  }, [
    blackConfig,
    hydrated,
    params.blackStorageKey,
    params.whiteStorageKey,
    whiteConfig,
  ]);

  return {
    blackConfig,
    whiteConfig,
    setBlackConfig,
    setWhiteConfig,
    hydrated,
  };
}
