# Apkcore TTS Plugin

A text-to-speech plugin for Obsidian that supports both browser native TTS and Microsoft Edge TTS.

## Features

- 🎙️ **Dual TTS Engine Support**
  - Browser native TTS (Web Speech API)
  - Microsoft Edge TTS (WebSocket-based)
- 🌏 **Rich Chinese Voice Support**
  - Dynamic voice list from Microsoft Edge TTS API
  - Multiple Chinese voices with different personalities
- ⚡ **Easy to Use**
  - Read selected text or entire document
  - Floating stop button during playback
  - Keyboard shortcuts support
  - Right-click context menu
- 🎛️ **Customizable**
  - Adjustable speech rate
  - Voice selection
  - Maximum text length limit

## Usage

### Basic Operations

1. **Read Selected Text**: Select text and use one of the following methods:
   - Right-click → "🔊 Read Selected Text"
   - Command palette → "Read Text"
   - Keyboard shortcut: `Ctrl+R` (customizable)
   - Click the ribbon icon

2. **Read Entire Document**: Without selecting text, use the same methods to read the full document

3. **Stop Reading**: 
   - Click the floating stop button
   - Use "Stop Reading" command
   - Keyboard shortcut: `Ctrl+Shift+S` (customizable)

4. **Pause/Resume**: 
   - Use "Pause/Resume Reading" command
   - Keyboard shortcut: `Ctrl+P` (customizable)

5. **Switch TTS Engine**: Use "Switch TTS Engine" command to toggle between Browser TTS and Edge TTS

### Settings

Open Settings → Apkcore TTS to configure:

- **Voice**: Select from available Chinese voices (automatically loaded from Edge TTS API)
- **Speech Rate**: Adjust reading speed (-50% to +100%)
- **Max Text Length**: Limit single playback text length (default 1800 characters)

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins → Browse
3. Search for "Apkcore TTS"
4. Click Install, then Enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/apkcore/apkcore-tts-plugin/releases)
2. Create a folder `YourVault/.obsidian/plugins/apkcore-tts/`
3. Copy the downloaded files into this folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

## Requirements

- Obsidian v1.0.0 or higher
- For Edge TTS: Internet connection to access Microsoft Edge TTS API

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build for development (watch mode)
npm run dev
```

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/apkcore/apkcore-tts-plugin/issues).

## License

MIT

## Acknowledgments

- Built with [Obsidian Plugin Template](https://github.com/obsidianmd/obsidian-sample-plugin)
- Uses Microsoft Edge TTS API
- Uses Web Speech API
