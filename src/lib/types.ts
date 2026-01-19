export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface TranslatorConfig {
  ollamaPort: number;
  ollamaHost: string;
  selectedModel: string;
  readLanguage: string;   // Idioma al traducir texto seleccionado (lectura)
  writeLanguage: string;  // Idioma al traducir en campos de texto (escritura)
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "cs", name: "Czech" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "hu", name: "Hungarian" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "ro", name: "Romanian" },
  { code: "sk", name: "Slovak" },
  { code: "uk", name: "Ukrainian" }
] as const;

export const DEFAULT_CONFIG: TranslatorConfig = {
  ollamaPort: 11434,
  ollamaHost: "localhost",
  selectedModel: "",
  readLanguage: "es",   // Por defecto traduce lo que lees a español
  writeLanguage: "en"   // Por defecto traduce lo que escribes a inglés
};