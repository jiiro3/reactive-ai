# Reactive AI SDK

React to state changes with streaming AI responses.

## Overview

Reactive AI SDK enables real-time AI interactions in React applications by monitoring state changes and triggering streaming AI responses. Built with TypeScript and designed for maximum flexibility.

## Features

- 🔄 **Reactive State Monitoring** - Watch any state variable or component
- 🚀 **Streaming AI Responses** - Real-time responses from OpenAI, Gemini, or custom providers
- 🛡️ **Loop Prevention** - Built-in protection against infinite triggering
- 🔌 **Plugin Architecture** - Extensible with custom actions and providers
- 📦 **Tree Shakeable** - Import only what you need
- 🎯 **TypeScript First** - Full type safety and autocomplete

## Quick Start

```bash
npm install reactive-ai-sdk
```

```typescript
import { useReactiveAI } from 'reactive-ai-sdk/react';
import { openaiProvider } from 'reactive-ai-sdk/providers';

function ChatComponent() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');

  useReactiveAI({
    watch: [userInput],
    providers: { 
      openai: openaiProvider({ apiKey: 'your-api-key' })
    },
    actions: [
      {
        trigger: (prev, next) => prev.userInput !== next.userInput && next.userInput.length > 0,
        execute: async ({ providers, state }) => {
          const stream = await providers.openai.stream({
            messages: [{ role: 'user', content: state.userInput }]
          });
          
          for await (const chunk of stream) {
            setResponse(prev => prev + chunk.content);
          }
        }
      }
    ]
  });

  return (
    <div>
      <input 
        value={userInput} 
        onChange={(e) => setUserInput(e.target.value)} 
      />
      <div>{response}</div>
    </div>
  );
}
```

## Packages

- **@reactive-ai/core** - Framework-agnostic core functionality
- **@reactive-ai/react** - React hooks and components
- **@reactive-ai/providers** - AI provider implementations

## Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Providers](./docs/providers.md)
- [Examples](./examples/)

## License

MIT