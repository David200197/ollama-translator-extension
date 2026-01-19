import type { OllamaModel } from "../lib/types";

export class OllamaService {
  private baseUrl: string;

  constructor(host: string = "localhost", port: number = 11434) {
    this.baseUrl = `http://${host}:${port}`;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  async translate(text: string, targetLanguage: string, model: string): Promise<string> {
    const prompt = `Translate the following text to ${targetLanguage}. Only respond with the translation, no explanations:\n\n${text}`;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 2048 }
      })
    });

    if (!response.ok) throw new Error(`Translation failed: ${response.statusText}`);

    const data = await response.json();
    return data.response.trim();
  }
}
