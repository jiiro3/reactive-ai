# Reactive AI SDK Demo

Interactive demonstration of the Reactive AI SDK's real-time state management and AI integration capabilities.

## 🚀 Quick Start

```bash
# From the SDK root directory
npm install
npm run build

# Run the demo
cd demo
npm install
npm run dev
```

Open http://localhost:3000 to see the interactive demo.

## ✨ Features Demonstrated

- **Real-time State Monitoring** - Watch as the SDK reacts to your typing
- **Automatic AI Triggering** - No buttons needed, just type and watch
- **Smart Debouncing** - Waits for you to pause before triggering
- **Streaming Responses** - See AI responses appear word by word
- **Loop Prevention** - Built-in protection against infinite loops
- **Multiple Modes** - Switch between streaming and reactive modes

## 🎮 Demo Modes

### Demo Provider (Default)
The demo runs with a built-in demo provider that simulates AI responses without requiring API keys. Perfect for testing the reactive functionality.

### Gemini 2.0 Flash Integration
The demo includes support for Google's latest Gemini 2.0 Flash model:

1. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your-gemini-key
   ```

3. Restart the dev server and select "Gemini 2.0 Flash" mode in the UI

**Note:** The demo uses the `gemini-2.0-flash-exp` model which offers 2x speed improvements over previous versions.

## 🏗️ Architecture

The demo showcases how to:
- Set up reactive AI state management
- Configure debouncing for optimal performance
- Handle streaming AI responses
- Prevent infinite trigger loops
- Build responsive UI that reacts to state changes

## 📝 License

MIT