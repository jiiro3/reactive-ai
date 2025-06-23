# Reactive AI SDK Examples

This directory contains examples demonstrating various use cases for the Reactive AI SDK.

## Examples

### [Basic Chat](./basic-chat.tsx)
Simple chat interface that responds to user input with streaming AI responses.

**Features:**
- Real-time streaming responses
- Debounced input handling
- Error handling
- Loading states

### [StorybookAI Integration](./storybookai-integration.tsx)
Shows how to integrate with StorybookAI's character chat system.

**Features:**
- Custom API provider
- Character state monitoring
- Real-time character mood updates
- Bidirectional streaming

### [Multi-Provider Comparison](./multi-provider.tsx)
Compare responses from multiple AI providers simultaneously.

**Features:**
- Multiple providers (OpenAI, Gemini)
- Side-by-side comparison
- Provider-specific configuration
- Response metrics

## Running the Examples

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   ```bash
   # .env.local
   REACT_APP_OPENAI_API_KEY=sk-...
   REACT_APP_GEMINI_API_KEY=AI...
   ```

3. **Import and Use**
   ```tsx
   import { BasicChat } from './examples/basic-chat';
   
   function App() {
     return <BasicChat />;
   }
   ```

## Key Patterns

### Reactive State Watching
```typescript
useReactiveAI({
  watch: [userInput, selectedModel], // Watch multiple state variables
  // ...
});
```

### Trigger Conditions
```typescript
{
  trigger: (prev, next) => {
    // Only trigger on meaningful changes
    return prev[0] !== next[0] && next[0].trim().length > 0;
  }
}
```

### Stream Handling
```typescript
{
  execute: async ({ providers, state }) => {
    const stream = await providers.openai.stream({
      messages: [{ role: 'user', content: state[0] }]
    });
    
    let response = '';
    for await (const chunk of stream) {
      response += chunk.content;
      setResponse(response); // Update UI in real-time
    }
  }
}
```

### Error Handling
```typescript
useReactiveAI({
  // ...
  onError: (error, context) => {
    console.error('Action failed:', error);
    // Handle gracefully - show user message, retry logic, etc.
  }
});
```

## Best Practices

1. **Debounce User Input**: Prevent excessive API calls
2. **Handle Loading States**: Show when AI is processing
3. **Error Recovery**: Graceful error handling and user feedback
4. **Prevent Infinite Loops**: Use `preventDefault: true` when needed
5. **Type Safety**: Use TypeScript for better development experience

## Custom Providers

See the StorybookAI example for creating custom providers:

```typescript
const customProvider = createCustomProvider(
  {
    name: 'my-api',
    baseURL: 'https://api.example.com'
  },
  async function* streamFunction(params) {
    // Custom streaming logic
  }
);
```

## Performance Tips

- Use `debounce` for user input (300-500ms)
- Use `throttle` for high-frequency events
- Set `preventDefault: true` to avoid loops
- Monitor `isExecuting` to prevent duplicate requests
- Use React.memo() for heavy components