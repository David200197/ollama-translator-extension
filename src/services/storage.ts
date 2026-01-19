import type { TranslatorConfig } from "../lib/types";
import { DEFAULT_CONFIG } from "../lib/types";

const STORAGE_KEY = "ollama-translator-config";

export const getConfig = async (): Promise<TranslatorConfig> => {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return { ...DEFAULT_CONFIG, ...result[STORAGE_KEY] };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = async (config: Partial<TranslatorConfig>): Promise<TranslatorConfig> => {
  const current = await getConfig();
  const updated = { ...current, ...config };
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  return updated;
};
