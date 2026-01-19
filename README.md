```markdown
# ⚡ Ollama Translator

A Chrome extension for instant text translation using local Ollama AI.

Built with **React**, **TypeScript**, **Shadcn/UI components**, and **esbuild**.

Press `Alt+T` to translate text anywhere on the web!

## ✨ Features

- 🔒 **100% Local** - All translations happen on your machine using Ollama
- ⚡ **Quick Translate** - Press `Alt+T` to translate instantly
- 📖 **Reading Mode** - Translate selected text to your preferred reading language
- ✏️ **Writing Mode** - Translate input fields to your preferred writing language
- 📝 **Smart Detection** - Automatically detects if you're reading or writing
- ⏱️ **Smart Timing** - Popup duration based on reading speed (~200 WPM)
- ⏸️ **Hover to Pause** - Pause the popup timer by hovering
- 🌍 **30+ Languages** - Support for major world languages
- 🎨 **Beautiful UI** - Built with Shadcn/UI components

## 📋 Requirements

- [Ollama](https://ollama.ai) installed and running locally
- A language model installed (e.g., `ollama pull llama3.2`)

## 🚀 Installation

### Quick Install

1. Download/clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Open Chrome → `chrome://extensions/`
5. Enable **Developer mode** (top right)
6. Click **Load unpacked**
7. Select the `dist` folder
8. **Important:** Copy the extension ID (shown under the extension name)
9. Configure Ollama CORS (see below)

### Development

```bash
npm install     # Install dependencies
npm run build   # Build extension
npm run watch   # Watch mode for development
```

## 🔧 Ollama CORS Configuration

The extension uses a background service worker to communicate with Ollama. You need to configure Ollama to allow requests from your extension.

### Find Your Extension ID

1. Go to `chrome://extensions/`
2. Find "Ollama Translator"
3. Copy the ID (e.g., `icahfbijpkpkenmnfnkjgnllekgplcmi`)

### Configure OLLAMA_ORIGINS

#### Windows

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to **Advanced** tab → **Environment Variables**
3. Under "System variables", click **New**
4. Variable name: `OLLAMA_ORIGINS`
5. Variable value: `chrome-extension://YOUR_EXTENSION_ID`
6. Click OK and close all dialogs
7. **Restart Ollama** (quit from system tray and reopen)

> **Note:** You may need to log out and log back in for the environment variable to take effect.

#### Linux (systemd)

```bash
sudo systemctl edit ollama.service
```

Add the following:

```ini
[Service]
Environment="OLLAMA_ORIGINS=chrome-extension://YOUR_EXTENSION_ID"
```

Then restart Ollama:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

#### macOS

```bash
launchctl setenv OLLAMA_ORIGINS "chrome-extension://YOUR_EXTENSION_ID"
```

Then restart Ollama.

#### Allow All Origins (Less Secure)

If you prefer to allow all origins (not recommended for production):

```
OLLAMA_ORIGINS=*
```

### Verify Configuration

After restarting Ollama, verify it's running:

```bash
ollama list
```

## 🎮 Usage

### 📖 Reading Mode (Selected Text)
1. Select any text on a webpage
2. Press **`Alt + T`**
3. 📌 Translation appears in a popup (in your **Reading Language**)
4. 🖱️ Hover over popup to pause the timer
5. 📋 Click "Copy" to copy translation

### ✏️ Writing Mode (Input Fields)
1. Click on any text input, textarea, or contenteditable element
2. Type or paste your text
3. Press **`Alt + T`**
4. ✅ Text is translated and replaced automatically (in your **Writing Language**)

## ⚙️ Configuration

Click the extension icon → **Settings** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| **Host** | Ollama server hostname | `localhost` |
| **Port** | Ollama server port | `11434` |
| **Model** | Select from installed Ollama models | - |
| **Reading Language** | Language for translating selected text | `Spanish` |
| **Writing Language** | Language for translating input fields | `English` |

### 🌐 Language Configuration Examples

| Use Case | Reading Language | Writing Language |
|----------|------------------|------------------|
| Spanish speaker browsing English sites | Spanish | English |
| English speaker learning French | English | French |
| Developer writing docs in English | Spanish | English |
| Bilingual user (ES/EN) | Spanish | English |

## 🌍 Supported Languages

English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Hindi, Dutch, Polish, Turkish, Vietnamese, Thai, Swedish, Danish, Finnish, Norwegian, Czech, Greek, Hebrew, Hungarian, Indonesian, Malay, Romanian, Slovak, Ukrainian

## 📖 Reading Time Algorithm

The popup display time is calculated based on average reading speed:

```
Formula: (word_count / 200 WPM) × 60 × 1000 + 1000ms base
Minimum: 2 seconds
Maximum: 30 seconds
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Shadcn/UI** - UI components (Button, Card, Input, Select, Badge)
- **Lucide React** - Icons
- **esbuild** - Fast bundler
- **Ollama** - Local AI inference

## 📁 Project Structure

```
ollama-translator/
├── src/
│   ├── background/       # Service worker for API calls
│   ├── components/ui/    # Shadcn UI components
│   ├── content/          # Content script (Alt+T handler)
│   ├── lib/              # Types & utils
│   ├── options/          # Settings page
│   ├── popup/            # Extension popup
│   ├── services/         # Ollama & storage services
│   └── manifest.json     # Chrome manifest v3
├── assets/               # Icons
├── dist/                 # Built extension
├── build.js              # Build script
└── package.json
```

## 🔍 Troubleshooting

### "Please select a model in settings"
- Open extension settings and select an Ollama model
- Make sure Ollama is running (`ollama list`)

### "Translation failed" or CORS errors
- Verify `OLLAMA_ORIGINS` is set correctly
- Restart Ollama after setting the environment variable
- On Windows, you may need to log out and back in

### Extension ID changed
- If you remove and reload the extension, Chrome assigns a new ID
- Update `OLLAMA_ORIGINS` with the new extension ID
- Restart Ollama

### Ollama not connecting
- Check if Ollama is running: `ollama list`
- Verify host/port in extension settings (default: `localhost:11434`)

### Text not being inserted in some websites
- Some websites (WhatsApp Web, Slack, etc.) use complex editors
- The extension tries 6 different methods to insert text
- If all methods fail, the translation is copied to clipboard
- Simply press `Ctrl+V` to paste

## 📄 License

MIT
```