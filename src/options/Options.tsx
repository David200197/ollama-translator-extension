import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Zap, Wifi, WifiOff, Loader2, RefreshCw, Settings, Globe, Cpu, Keyboard, Heart } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Input, Label } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { getConfig, saveConfig } from "../services/storage";
import { OllamaService } from "../services/ollama";
import { SUPPORTED_LANGUAGES, type TranslatorConfig, type OllamaModel } from "../lib/types";

type Status = "checking" | "connected" | "disconnected";

function Options() {
  const [config, setConfig] = useState<TranslatorConfig | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);
  const [tempHost, setTempHost] = useState("");
  const [tempPort, setTempPort] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const cfg = await getConfig();
    setConfig(cfg);
    setTempHost(cfg.ollamaHost);
    setTempPort(cfg.ollamaPort.toString());
    checkAndLoadModels(cfg);
  };

  const checkAndLoadModels = async (cfg: TranslatorConfig) => {
    setStatus("checking");
    setLoading(true);
    const ollama = new OllamaService(cfg.ollamaHost, cfg.ollamaPort);
    const ok = await ollama.checkConnection();
    
    if (ok) {
      setStatus("connected");
      const modelList = await ollama.listModels();
      setModels(modelList);
    } else {
      setStatus("disconnected");
      setModels([]);
    }
    setLoading(false);
  };

  const handleSaveConnection = async () => {
    if (!config) return;
    const port = parseInt(tempPort) || 11434;
    const updated = await saveConfig({ ollamaHost: tempHost || "localhost", ollamaPort: port });
    setConfig(updated);
    checkAndLoadModels(updated);
  };

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!config) return;
    const updated = await saveConfig({ selectedModel: e.target.value });
    setConfig(updated);
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!config) return;
    const updated = await saveConfig({ targetLanguage: e.target.value });
    setConfig(updated);
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  if (!config) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, hsl(222 47% 11%), hsl(217 33% 17% / 0.2))' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              Ollama Translator
            </h1>
          </div>
          <p className="text-muted-foreground">Local AI-powered translation with Alt+T</p>
        </div>

        {/* Connection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connection Settings
            </CardTitle>
            <CardDescription>Configure your Ollama server connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={status === "connected" ? "success" : status === "checking" ? "warning" : "destructive"} className="gap-1">
                {status === "connected" ? <><Wifi className="h-3 w-3" /> Connected</> : 
                 status === "checking" ? <><Loader2 className="h-3 w-3 animate-spin" /> Checking</> : 
                 <><WifiOff className="h-3 w-3" /> Disconnected</>}
              </Badge>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input id="host" value={tempHost} onChange={e => setTempHost(e.target.value)} placeholder="localhost" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input id="port" type="number" value={tempPort} onChange={e => setTempPort(e.target.value)} placeholder="11434" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveConnection} className="flex-1">Save Connection</Button>
              <Button variant="outline" onClick={() => config && checkAndLoadModels(config)} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Model Selection
            </CardTitle>
            <CardDescription>Choose the Ollama model for translations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading models...
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-muted-foreground">No models found. Make sure Ollama is running.</p>
                <p className="text-sm text-muted-foreground">
                  Run <code className="px-2 py-1 rounded-md bg-secondary text-primary">ollama pull llama3.2</code> to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="model">Select Model</Label>
                <Select id="model" value={config.selectedModel} onChange={handleModelChange}>
                  <option value="">-- Select a model --</option>
                  {models.map(m => (
                    <option key={m.name} value={m.name}>{m.name} ({formatSize(m.size)})</option>
                  ))}
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Translation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Translation Settings
            </CardTitle>
            <CardDescription>Set your preferred target language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">Target Language</Label>
              <Select id="language" value={config.targetLanguage} onChange={handleLanguageChange}>
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* How to Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary">
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-1 rounded-md bg-background border border-border text-sm font-semibold">Alt</kbd>
                <span className="text-muted-foreground">+</span>
                <kbd className="px-3 py-1 rounded-md bg-background border border-border text-sm font-semibold">T</kbd>
              </div>
              <span className="text-muted-foreground">Translate selected text or input field</span>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">In input fields:</strong> Translates and replaces all text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Selected text:</strong> Shows translation popup (hover to pause timer)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
          Made with <Heart className="h-4 w-4 text-destructive" style={{ fill: 'hsl(0 62% 55%)' }} /> using Ollama local AI
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Options />);
