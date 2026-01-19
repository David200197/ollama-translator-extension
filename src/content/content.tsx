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

// Calculate reading time
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
      position: fixed; z-index: 2147483647; top: 20px; left: 50%; transform: translateX(-50%);
      width: auto; max-width: min(600px, calc(100vw - 40px)); min-width: 300px;
      background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px 20px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5); font-family: -apple-system, sans-serif; color: #f1f5f9;
      animation: ot-slideDown 0.25s ease-out;
    }
    @keyframes ot-slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    .ot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #334155; }
    .ot-title { font-size: 12px; font-weight: 600; color: #4facfe; text-transform: uppercase; letter-spacing: 1px; }
    .ot-close { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; }
    .ot-close:hover { color: #ef4444; }
    .ot-text { font-size: 15px; line-height: 1.7; margin-bottom: 14px; max-height: 60vh; overflow-y: auto; white-space: pre-wrap; }
    .ot-actions { display: flex; gap: 8px; margin-bottom: 12px; }
    .ot-btn { background: rgba(79,172,254,0.15); border: 1px solid rgba(79,172,254,0.3); color: #4facfe; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; }
    .ot-btn:hover { background: rgba(79,172,254,0.25); }
    .ot-progress { height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
    .ot-progress-fill { height: 100%; background: linear-gradient(90deg, #4facfe, #00f2fe); width: 100%; }
    .ot-hint { margin-top: 8px; font-size: 10px; color: #94a3b8; text-align: center; }
    
    .ot-loading { position: fixed; z-index: 2147483647; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 14px 24px; border-radius: 10px; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
    .ot-spinner { width: 16px; height: 16px; border: 2px solid rgba(79,172,254,0.3); border-top-color: #4facfe; border-radius: 50%; animation: ot-spin 0.8s linear infinite; }
    @keyframes ot-spin { to { transform: rotate(360deg); } }
    
    .ot-notification { position: fixed; bottom: 20px; right: 20px; background: #1e293b; border: 1px solid #334155; padding: 12px 20px; border-radius: 8px; color: #f1f5f9; z-index: 2147483647; animation: ot-slideUp 0.3s; }
    .ot-notification.error { border-color: #ef4444; }
    @keyframes ot-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(style);
};

let currentPopup: HTMLElement | null = null;
let progressInterval: number | null = null;
let isPaused = false;

const removePopup = () => {
  if (currentPopup) { currentPopup.remove(); currentPopup = null; }
  if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
  isPaused = false;
};

const showNotification = (text: string, type: "success" | "error" | "warning" = "success") => {
  const notification = document.createElement("div");
  notification.className = `ot-notification ${type === "error" ? "error" : ""}`;
  notification.textContent = text;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

const showLoading = () => {
  removePopup();
  const loading = document.createElement("div");
  loading.className = "ot-loading";
  loading.innerHTML = `<div class="ot-spinner"></div><span>Translating...</span>`;
  document.body.appendChild(loading);
  currentPopup = loading;
};

const showTranslation = (text: string) => {
  removePopup();
  const popup = document.createElement("div");
  popup.className = "ot-popup";
  const readingTime = calculateReadingTime(text);
  popup.innerHTML = `
    <div class="ot-header">
      <span class="ot-title">Translation</span>
      <button class="ot-close">×</button>
    </div>
    <div class="ot-text">${escapeHtml(text)}</div>
    <div class="ot-actions"><button class="ot-btn">📋 Copy</button></div>
    <div class="ot-progress"><div class="ot-progress-fill"></div></div>
  `;
  document.body.appendChild(popup);
  currentPopup = popup;

  popup.querySelector(".ot-close")?.addEventListener("click", removePopup);
  popup.querySelector(".ot-btn")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(text);
    showNotification("Copied!");
  });
  
  // Auto remove logic simplified
  const progressFill = popup.querySelector(".ot-progress-fill") as HTMLElement;
  let start = Date.now();
  const interval = setInterval(() => {
    if (isPaused) return;
    let pct = 100 - ((Date.now() - start) / readingTime) * 100;
    if (pct <= 0) { clearInterval(interval); removePopup(); }
    else progressFill.style.width = `${pct}%`;
  }, 100);
  progressInterval = interval;
};

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// ============================================================================
// LÓGICA CORREGIDA PARA MANEJO DE TEXT INPUTS (WhatsApp Fix)
// ============================================================================

// Detectar editor complejo
const isComplexEditor = (element: HTMLElement): boolean => {
  const hostname = window.location.hostname;
  if (hostname.includes('web.whatsapp.com') || hostname.includes('web.telegram.org')) return true;
  // Añade otros si es necesario
  return false;
};

// Disparar eventos de entrada para que React/Vue detecten el cambio
const triggerInputEvents = (element: HTMLElement) => {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

// Método principal para insertar texto
const insertTextIntoElement = async (
  element: HTMLElement,
  text: string
): Promise<{ success: boolean; method: string }> => {
  
  // -------------------------------------------------------------------------
// CASO 1: WHATSAPP WEB Y EDITORES COMPLEJOS (CONTENTEDITABLE)
// -------------------------------------------------------------------------
  if (isComplexEditor(element) && element.isContentEditable) {
    console.log("[OT] Complex Editor Strategy: Select All + InsertText");
    
    try {
      // 1. Asegurar foco
      element.focus();
      
      // 2. Seleccionar TODO usando execCommand (más seguro que Range API para React)
      // Esto simula un Ctrl+A real
      document.execCommand('selectAll', false, undefined);
      
      // 3. Pausa breve para permitir que el navegador/React procesen la selección
      await new Promise(r => setTimeout(r, 20));

      // 4. Insertar el texto. 
      // execCommand('insertText') reemplaza automáticamente la selección actual.
      // Es el método más nativo y menos propenso a errores en WhatsApp.
      const inserted = document.execCommand('insertText', false, text);
      
      if (inserted) {
        triggerInputEvents(element);
        // Verificación laxa: ¿hay texto?
        const content = element.innerText || "";
        if (content.trim().length > 0) {
          console.log("[OT] Insert successful via execCommand insertText");
          return { success: true, method: "execCommand-complex" };
        }
      }
    } catch (e) {
      console.warn("[OT] Complex strategy failed, trying fallback", e);
    }

    // FALLBACK 1: Clipboard Paste (Si insertText falla)
    console.log("[OT] Trying Clipboard Paste fallback...");
    try {
      const originalClipboard = await navigator.clipboard.readText().catch(() => "");
      await navigator.clipboard.writeText(text);
      
      element.focus();
      document.execCommand('selectAll', false, undefined);
      await new Promise(r => setTimeout(r, 20));
      const pasted = document.execCommand('paste');
      
      // Restaurar clipboard si es posible
      if (originalClipboard) navigator.clipboard.writeText(originalClipboard);

      if (pasted) {
        triggerInputEvents(element);
        return { success: true, method: "clipboard-complex" };
      }
    } catch (e) {
      console.error("[OT] Clipboard fallback failed", e);
    }

    return { success: false, method: "complex-failed" };
  }

  // -------------------------------------------------------------------------
// CASO 2: INPUTS Y TEXTAREAS NORMALES (NO REACT)
// -------------------------------------------------------------------------
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    console.log("[OT] Standard Input Strategy");
    element.focus();
    
    // Para inputs nativos, setear valor directamente suele funcionar
    const nativeSetter = Object.getOwnPropertyDescriptor(
      element.constructor.prototype, "value"
    )?.set;
    
    if (nativeSetter) {
      nativeSetter.call(element, text);
      triggerInputEvents(element);
      return { success: true, method: "native-setter" };
    } else {
      element.value = text;
      triggerInputEvents(element);
      return { success: true, method: "direct-value" };
    }
  }

  // -------------------------------------------------------------------------
// CASO 3: OTROS CONTENTEDITABLE GENÉRICOS
// -------------------------------------------------------------------------
  try {
    element.focus();
    document.execCommand('selectAll', false, undefined);
    await new Promise(r => setTimeout(r, 10));
    if (document.execCommand('insertText', false, text)) {
      return { success: true, method: "generic-exec" };
    }
  } catch (e) {
    console.error(e);
  }

  return { success: false, method: "unknown" };
};

// ============================================================================
// HANDLERS DE EVENTOS
// ============================================================================

const handleInputTranslation = async (element: HTMLElement) => {
  let text = "";
  const targetElement = element;

  if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
    text = targetElement.value;
  } else if (targetElement.isContentEditable) {
    text = targetElement.innerText || targetElement.textContent || "";
  }

  if (!text.trim()) {
    showNotification("No text to translate", "error");
    return;
  }

  showLoading();

  try {
    const config = await getConfig();
    if (!config.selectedModel) {
      showNotification("Please select a model in settings", "error");
      return;
    }

    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === config.writeLanguage)?.name || "English";

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

    removePopup();

    const result = await insertTextIntoElement(targetElement, translated);

    if (result.success) {
      showNotification(`✓ Translated to ${targetLang}!`);
    } else {
      await navigator.clipboard.writeText(translated);
      showNotification("⚠ Auto-insert failed. Text copied to clipboard.", "warning");
    }
  } catch (error) {
    console.error("[OT] Error:", error);
    showNotification("Translation failed. Check Ollama.", "error");
  }
};

const handleSelectionTranslation = async () => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text) return;

  showLoading();

  try {
    const config = await getConfig();
    if (!config.selectedModel) {
      showNotification("Select a model first", "error");
      return;
    }

    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === config.readLanguage)?.name || "Spanish";
    const translated = await sendToBackground<string>({
      type: "TRANSLATE",
      payload: { text, targetLanguage: targetLang, model: config.selectedModel, host: config.ollamaHost, port: config.ollamaPort },
    });

    showTranslation(translated);
  } catch (error) {
    showNotification("Translation failed.", "error");
  }
};

const handleKeyDown = async (e: KeyboardEvent) => {
  if (e.key === "Escape" && currentPopup) { removePopup(); return; }

  if (e.altKey && (e.key === "t" || e.key === "T")) {
    e.preventDefault();
    e.stopPropagation();
    const activeElement = document.activeElement;
    const isInput = activeElement instanceof HTMLElement && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement.isContentEditable);

    if (isInput) await handleInputTranslation(activeElement as HTMLElement);
    else await handleSelectionTranslation();
  }
};

// Init
injectStyles();
document.addEventListener("keydown", handleKeyDown, true);
console.log("Ollama Translator loaded");