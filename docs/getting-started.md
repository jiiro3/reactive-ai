# Getting Started with Reactive AI SDK

Reactive AI SDK enables real-time AI interactions in React applications by monitoring state changes and triggering streaming AI responses.

## Installation

```bash
npm install @reactive-ai/react @reactive-ai/providers
```

## Quick Start

Here's a simple example that responds to user input with streaming AI:

```typescript
import React, { useState } from 'react';
import { useReactiveAI } from '@reactive-ai/react';
import { openai } from '@reactive-ai/providers';

function App() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');

  useReactiveAI({
    watch: [userInput],
    providers: {
      openai: openai({ apiKey: 'your-api-key' })
    },
    actions: [
      {
        trigger: (prev, next) => prev[0] !== next[0] && next[0].length > 0,
        execute: async ({ providers, state }) => {
          setResponse('');
          const stream = await providers.openai.stream({
            messages: [{ role: 'user', content: state[0] }]
          });
          
          let fullResponse = '';
          for await (const chunk of stream) {
            fullResponse += chunk.content;
            setResponse(fullResponse);
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
        placeholder="Type something..."
      />
      <div>{response}</div>
    </div>
  );
}
```

## Core Concepts

### 1. State Watching

The SDK monitors React state variables for changes:

```typescript
useReactiveAI({
  watch: [userInput, selectedModel, temperature],
  // ... rest of config
});
```

### 2. Triggers

Triggers determine when actions should execute:

```typescript
{
  trigger: (previousState, currentState, metadata) => {
    // Return true to execute the action
    return previousState[0] !== currentState[0];
  }
}
```

### 3. Actions

Actions define what happens when triggers fire:

```typescript
{
  execute: async ({ state, providers, metadata }) => {
    // Your logic here - stream AI responses, call APIs, etc.
  }
}
```

### 4. Providers

Providers handle AI service integration:

```typescript
import { openai, gemini, createCustomProvider } from '@reactive-ai/providers';

const providers = {
  openai: openai({ apiKey: 'sk-...' }),
  gemini: gemini({ apiKey: 'AI...' }),
  custom: createCustomProvider({
    name: 'my-api',
    baseURL: 'https://api.example.com'
  })
};
```

## Advanced Features

### Debouncing and Throttling

Prevent excessive API calls:

```typescript
{
  trigger: (prev, next) => prev[0] !== next[0],
  execute: async ({ providers, state }) => { /* ... */ },
  debounce: 500, // Wait 500ms after last change
  throttle: 1000 // Maximum once per second
}
```

### Conditional Execution

Add conditions to actions:

```typescript
{
  trigger: (prev, next) => prev[0] !== next[0],
  conditions: [
    ({ state }) => state[0].length > 3, // Minimum 3 characters
    ({ state }) => !state[0].includes('stop') // Don't process "stop"
  ],
  execute: async ({ providers, state }) => { /* ... */ }
}
```

### Loop Prevention

Prevent infinite loops when actions modify watched state:

```typescript
{
  trigger: (prev, next) => prev[0] !== next[0],
  execute: async ({ state }) => {
    // This might modify watched state
    setUserInput(state[0] + ' (processed)');
  },
  preventDefault: true // Prevents re-triggering
}
```

### Error Handling

Handle errors gracefully:

```typescript
useReactiveAI({
  // ... other config
  onError: (error, context) => {
    console.error('AI action failed:', error);
    // Could show user notification, log to analytics, etc.
  }
});
```

## Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Providers Guide](./providers.md) - Working with different AI services
- [Examples](../examples/) - Complete working examples
- [Advanced Patterns](./advanced-patterns.md) - Complex use cases and patterns

## Environment Variables

For the examples to work, you'll need to set up your API keys:

```bash
# .env.local
REACT_APP_OPENAI_API_KEY=sk-...
REACT_APP_GEMINI_API_KEY=AI...
```

## TypeScript Support

The SDK is built with TypeScript and provides full type safety:

```typescript
interface MyState {
  input: string;
  model: 'gpt-3.5' | 'gpt-4';
}

useReactiveAI<MyState>({
  watch: [{ input: userInput, model: selectedModel }],
  actions: [
    {
      trigger: (prev, next) => {
        // prev and next are fully typed as MyState[]
        return prev[0].input !== next[0].input;
      },
      execute: async ({ state }) => {
        // state is typed as MyState[]
        console.log(state[0].input, state[0].model);
      }
    }
  ]
});
```