import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Settings, Zap, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { getConfig } from "../services/storage";
import { OllamaService } from "../services/ollama";
import { SUPPORTED_LANGUAGES, type TranslatorConfig } from "../lib/types";

type Status = "checking" | "connected" | "disconnected";

function Popup() {
  const [config, setConfig] = useState<TranslatorConfig | null>(null);
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const cfg = await getConfig();
    setConfig(cfg);
    checkConnection(cfg);
  };

  const checkConnection = async (cfg: TranslatorConfig) => {
    setStatus("checking");
    const ollama = new OllamaService(cfg.ollamaHost, cfg.ollamaPort);
    const ok = await ollama.checkConnection();
    setStatus(ok ? "connected" : "disconnected");
  };

  const openOptions = () => chrome.runtime.openOptionsPage();

  if (!config) return <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;

  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === config.targetLanguage)?.name || "English";

  return (
    <div className="p-4 bg-background">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-3 pt-0 px-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              Ollama Translator
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="px-0 space-y-4">
          {/* Status */}
          <div className="space-y-2 p-3 rounded-lg bg-secondary">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={status === "connected" ? "success" : status === "checking" ? "warning" : "destructive"}
                className="gap-1"
              >
                {status === "connected" ? (
                  <><Wifi className="h-3 w-3" /> Connected</>
                ) : status === "checking" ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Checking</>
                ) : (
                  <><WifiOff className="h-3 w-3" /> Offline</>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Model</span>
              <span className="text-sm font-medium truncate max-w-[140px]">
                {config.selectedModel || "Not selected"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Target</span>
              <span className="text-sm font-medium">{targetLang}</span>
            </div>
          </div>

          {/* Shortcut */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-primary" style={{ borderColor: 'rgba(79,172,254,0.3)', background: 'rgba(79,172,254,0.05)' }}>
            <kbd className="px-2 py-1 rounded-md bg-secondary text-xs font-semibold">Alt</kbd>
            <span className="text-muted-foreground">+</span>
            <kbd className="px-2 py-1 rounded-md bg-secondary text-xs font-semibold">T</kbd>
            <span className="text-sm text-muted-foreground ml-2">to translate</span>
          </div>

          {/* Settings Button */}
          <Button onClick={openOptions} className="w-full gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>

          {/* Warnings */}
          {status === "disconnected" && (
            <div className="p-3 rounded-lg text-sm text-destructive" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              Ollama not running on {config.ollamaHost}:{config.ollamaPort}
            </div>
          )}

          {!config.selectedModel && status === "connected" && (
            <div className="p-3 rounded-lg text-sm" style={{ color: '#eab308', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
              Please select a model in settings
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
