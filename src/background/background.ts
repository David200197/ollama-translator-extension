import { OllamaService } from "../services/ollama";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "TRANSLATE") {
    const { text, targetLanguage, model, host, port } = message.payload;
    
    const ollama = new OllamaService(host, port);
    ollama.translate(text, targetLanguage, model)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep channel open for async response
  }
  
  if (message.type === "CHECK_CONNECTION") {
    const { host, port } = message.payload;
    const ollama = new OllamaService(host, port);
    ollama.checkConnection()
      .then(ok => sendResponse({ success: true, data: ok }))
      .catch(() => sendResponse({ success: true, data: false }));
    
    return true;
  }
  
  if (message.type === "LIST_MODELS") {
    const { host, port } = message.payload;
    const ollama = new OllamaService(host, port);
    ollama.listModels()
      .then(models => sendResponse({ success: true, data: models }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true;
  }
});

console.log("[OT] Background service worker started");