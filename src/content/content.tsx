import { getConfig } from "../services/storage";
import { SUPPORTED_LANGUAGES } from "../lib/types";

// Helper para enviar mensajes al background
function sendToBackground<T>(message: {
  type: string;
  payload?: unknown;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.success) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || "Unknown error"));
      }
    });
  });
}

// Calculate reading time: ~200 WPM, min 2s, max 30s
const calculateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  const ms = (words / 200) * 60 * 1000 + 1000;
  return Math.max(2000, Math.min(30000, ms));
};

// Inject styles
const injectStyles = () => {
  if (document.getElementById("ollama-translator-styles")) return;

  const style = document.createElement("style");
  style.id = "ollama-translator-styles";
  style.textContent = `
    .ot-popup {
      position: fixed;
      z-index: 2147483647;
      max-width: 360px;
      min-width: 220px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(79,172,254,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #f1f5f9;
      animation: ot-slideIn 0.2s ease-out;
    }
    @keyframes ot-slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .ot-title {
      font-size: 11px;
      font-weight: 600;
      color: #4facfe;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .ot-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      font-size: 18px;
      line-height: 1;
    }
    .ot-close:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .ot-text {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 12px;
      word-wrap: break-word;
    }
    .ot-actions { display: flex; gap: 8px; margin-bottom: 12px; }
    .ot-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(79,172,254,0.15);
      border: 1px solid rgba(79,172,254,0.3);
      color: #4facfe;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ot-btn:hover { background: rgba(79,172,254,0.25); border-color: #4facfe; }
    .ot-progress { height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
    .ot-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4facfe, #00f2fe);
      border-radius: 2px;
      transition: width 0.05s linear;
    }
    .ot-hint { margin-top: 8px; font-size: 10px; color: #94a3b8; text-align: center; }
    .ot-loading {
      position: fixed;
      z-index: 2147483647;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 14px 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #f1f5f9;
      animation: ot-fadeIn 0.2s ease-out;
    }
    @keyframes ot-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .ot-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(79,172,254,0.3);
      border-top-color: #4facfe;
      border-radius: 50%;
      animation: ot-spin 0.8s linear infinite;
    }
    @keyframes ot-spin { to { transform: rotate(360deg); } }
    .ot-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 14px 20px;
      font-size: 13px;
      z-index: 2147483647;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      animation: ot-slideUp 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #f1f5f9;
    }
    .ot-notification.error { border-color: rgba(239,68,68,0.5); }
    @keyframes ot-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(style);
};

// State
let currentPopup: HTMLElement | null = null;
let progressInterval: number | null = null;
let isPaused = false;

// Remove popup
const removePopup = () => {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  isPaused = false;
};

// Show notification
const showNotification = (text: string, isError = false) => {
  removePopup();
  const notification = document.createElement("div");
  notification.className = `ot-notification ${isError ? "error" : ""}`;
  notification.textContent = text;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Show loading
const showLoading = (x: number, y: number) => {
  removePopup();
  const loading = document.createElement("div");
  loading.className = "ot-loading";
  loading.style.left = `${x}px`;
  loading.style.top = `${y}px`;
  loading.innerHTML = `<div class="ot-spinner"></div><span>Translating...</span>`;
  document.body.appendChild(loading);
  currentPopup = loading;
};

// Show translation popup
const showTranslation = (text: string, x: number, y: number) => {
  removePopup();

  const popup = document.createElement("div");
  popup.className = "ot-popup";
  popup.style.left = `${Math.min(x, window.innerWidth - 380)}px`;
  popup.style.top = `${Math.max(10, y)}px`;

  const readingTime = calculateReadingTime(text);
  let progress = 100;
  const startTime = Date.now();

  popup.innerHTML = `
    <div class="ot-header">
      <span class="ot-title">Translation</span>
      <button class="ot-close" title="Close">×</button>
    </div>
    <div class="ot-text">${text}</div>
    <div class="ot-actions">
      <button class="ot-btn ot-copy">📋 Copy</button>
    </div>
    <div class="ot-progress">
      <div class="ot-progress-fill" style="width: 100%"></div>
    </div>
    <div class="ot-hint">Hover to pause</div>
  `;

  document.body.appendChild(popup);
  currentPopup = popup;

  popup.querySelector(".ot-close")?.addEventListener("click", removePopup);
  popup.querySelector(".ot-copy")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!");
  });

  popup.addEventListener("mouseenter", () => {
    isPaused = true;
  });
  popup.addEventListener("mouseleave", () => {
    isPaused = false;
  });

  const progressFill = popup.querySelector(".ot-progress-fill") as HTMLElement;
  const hint = popup.querySelector(".ot-hint") as HTMLElement;

  progressInterval = window.setInterval(() => {
    if (isPaused) {
      hint.textContent = "Paused - move mouse away to continue";
      return;
    }
    hint.textContent = "Hover to pause";

    const elapsed = Date.now() - startTime;
    progress = Math.max(0, 100 - (elapsed / readingTime) * 100);
    progressFill.style.width = `${progress}%`;

    if (progress <= 0) removePopup();
  }, 50);
};

// Handle input field translation
const handleInputTranslation = async (element: HTMLElement) => {
  let text = "";

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    text = element.value;
    element.select();
  } else if (element.isContentEditable) {
    text = element.innerText || "";
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }

  if (!text.trim()) {
    showNotification("No text to translate", true);
    return;
  }

  const rect = element.getBoundingClientRect();
  showLoading(rect.left, rect.top - 60);

  try {
    const config = await getConfig();
    if (!config.selectedModel) {
      showNotification("Please select a model in settings", true);
      return;
    }

    const targetLang =
      SUPPORTED_LANGUAGES.find((l) => l.code === config.targetLanguage)?.name ||
      "English";

    // Usar background script para la traducción
    const translated = await sendToBackground<string>({
      type: "TRANSLATE",
      payload: {
        text,
        targetLanguage: targetLang,
        model: config.selectedModel,
        host: config.ollamaHost,
        port: config.ollamaPort,
      },
    });

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.value = translated;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (element.isContentEditable) {
      element.innerText = translated;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }

    showNotification("Text translated successfully!");
  } catch (error) {
    console.error("[OT] Translation error:", error);
    showNotification("Translation failed. Check if Ollama is running.", true);
  }
};

// Handle selection translation
const handleSelectionTranslation = async () => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text) {
    showNotification("No text selected", true);
    return;
  }

  const range = selection?.getRangeAt(0);
  const rect = range?.getBoundingClientRect();
  const x = rect?.left || 100;
  const y = (rect?.bottom || 100) + 10;

  showLoading(x, y);

  try {
    const config = await getConfig();
    if (!config.selectedModel) {
      showNotification("Please select a model in settings", true);
      return;
    }

    const targetLang =
      SUPPORTED_LANGUAGES.find((l) => l.code === config.targetLanguage)?.name ||
      "English";

    // Usar background script para la traducción
    const translated = await sendToBackground<string>({
      type: "TRANSLATE",
      payload: {
        text,
        targetLanguage: targetLang,
        model: config.selectedModel,
        host: config.ollamaHost,
        port: config.ollamaPort,
      },
    });

    showTranslation(translated, x, y);
  } catch (error) {
    console.error("[OT] Translation error:", error);
    showNotification("Translation failed. Check if Ollama is running.", true);
  }
};

// Keyboard handler
const handleKeyDown = async (e: KeyboardEvent) => {
  if (e.altKey && (e.key === "t" || e.key === "T")) {
    e.preventDefault();
    e.stopPropagation();

    const activeElement = document.activeElement;
    const isInputField =
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      (activeElement instanceof HTMLElement && activeElement.isContentEditable);

    if (isInputField) {
      await handleInputTranslation(activeElement as HTMLElement);
    } else {
      await handleSelectionTranslation();
    }
  }
};

// Initialize
injectStyles();
document.addEventListener("keydown", handleKeyDown, true);
console.log("🌐 Ollama Translator loaded - Press Alt+T to translate");
