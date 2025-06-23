# API Reference

## React Hooks

### `useReactiveAI<T>(config: UseReactiveAIConfig<T>): ReactiveAIHookReturn`

Main hook for reactive AI state management.

#### Parameters

- `config: UseReactiveAIConfig<T>` - Configuration object

```typescript
interface UseReactiveAIConfig<T = any> {
  watch: T[] | (() => T[]);
  providers: Record<string, AIProvider>;
  actions: ReactiveAction<T>[];
  onError?: (error: Error, context: ActionContext<T>) => void;
  debug?: boolean;
  dependencies?: React.DependencyList;
}
```

#### Returns

```typescript
interface ReactiveAIHookReturn {
  isReady: boolean;
  isExecuting: boolean;
  lastError: Error | null;
  addAction: (action: ReactiveAction) => void;
  removeAction: (actionId: string) => void;
  reset: () => void;
}
```

### `useStreamingResponse(options?: StreamingResponseOptions): UseStreamingResponseReturn`

Hook for handling streaming AI responses.

#### Parameters

- `options?: StreamingResponseOptions` - Optional configuration

```typescript
interface StreamingResponseOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}
```

#### Returns

```typescript
interface UseStreamingResponseReturn {
  response: string;
  isStreaming: boolean;
  error: Error | null;
  reset: () => void;
  stream: (provider: AIProvider, params: any) => Promise<void>;
}
```

## Core Types

### `ReactiveAction<T>`

Defines an action to execute when triggers fire.

```typescript
interface ReactiveAction<T = any> {
  id?: string;
  trigger: TriggerFunction<T>;
  execute: ActionFunction<T>;
  preventDefault?: boolean;
  debounce?: number;
  throttle?: number;
  conditions?: ConditionFunction<T>[];
}
```

### `TriggerFunction<T>`

Function that determines when an action should execute.

```typescript
type TriggerFunction<T = any> = (
  previousState: T, 
  currentState: T, 
  metadata: { timestamp: number }
) => boolean;
```

### `ActionFunction<T>`

Function that executes when trigger conditions are met.

```typescript
type ActionFunction<T = any> = (
  context: ActionContext<T>
) => Promise<void> | void;
```

### `ActionContext<T>`

Context provided to action functions.

```typescript
interface ActionContext<T = any> {
  state: T;
  providers: Record<string, AIProvider>;
  metadata: {
    trigger: string;
    timestamp: number;
    previousState?: T;
  };
}
```

## AI Providers

### `AIProvider`

Base interface for AI service providers.

```typescript
interface AIProvider {
  name: string;
  stream(params: StreamParams): Promise<AsyncIterable<StreamChunk>>;
  complete?(params: CompleteParams): Promise<string>;
}
```

### `StreamParams`

Parameters for streaming requests.

```typescript
interface StreamParams {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}
```

### `StreamChunk`

Individual chunk from streaming response.

```typescript
interface StreamChunk {
  content: string;
  done?: boolean;
  metadata?: Record<string, any>;
}
```

### `Message`

Chat message format.

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

## Provider Factories

### OpenAI Provider

```typescript
import { openai } from '@reactive-ai/providers';

const provider = openai({
  apiKey: 'sk-...',
  defaultModel: 'gpt-3.5-turbo',
  baseURL?: string,
  organization?: string,
  timeout?: number
});
```

### Gemini Provider

```typescript
import { gemini } from '@reactive-ai/providers';

const provider = gemini({
  apiKey: 'AI...',
  defaultModel: 'gemini-1.5-flash',
  timeout?: number,
  safetySettings?: any[],
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  }
});
```

### Custom Provider

```typescript
import { createCustomProvider } from '@reactive-ai/providers';

const provider = createCustomProvider(
  {
    name: 'my-api',
    baseURL: 'https://api.example.com',
    apiKey?: string,
    headers?: Record<string, string>,
    timeout?: number
  },
  streamFunction?, // Optional custom stream function
  completeFunction? // Optional custom complete function
);
```

### API Provider

```typescript
import { createAPIProvider } from '@reactive-ai/providers';

const provider = createAPIProvider({
  name: 'my-api',
  baseURL: 'https://api.example.com',
  apiKey: 'optional-key',
  headers: {
    'Custom-Header': 'value'
  }
});
```

## Core Engine (Advanced)

### `CoreReactiveEngine<T>`

The core engine that powers the React hooks.

```typescript
class CoreReactiveEngine<T = any> implements ReactiveEngine<T> {
  configure(config: ReactiveConfig<T>): void;
  updateState(newState: T): Promise<void>;
  addAction(action: ReactiveAction<T>): void;
  removeAction(actionId: string): void;
  destroy(): void;
}
```

### `ReactiveConfig<T>`

Configuration for the core engine.

```typescript
interface ReactiveConfig<T = any> {
  state: T;
  providers: Record<string, AIProvider>;
  actions: ReactiveAction<T>[];
  onError?: (error: Error, context: ActionContext<T>) => void;
  debug?: boolean;
}
```

## Utility Functions

### Debounce

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T;
```

### Throttle

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T;
```

### Deep Comparison

```typescript
function deepEqual(a: any, b: any): boolean;
function hasChanged<T>(previous: T, current: T, shallow?: boolean): boolean;
```

### Async Utilities

```typescript
async function* map<T, U>(
  iterable: AsyncIterable<T>,
  mapper: (value: T) => U | Promise<U>
): AsyncIterable<U>;

async function* filter<T>(
  iterable: AsyncIterable<T>,
  predicate: (value: T) => boolean | Promise<boolean>
): AsyncIterable<T>;

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]>;
```

## Error Types

Common errors you might encounter:

- `Error: OpenAI SDK not found` - Install `npm install openai`
- `Error: Google Generative AI SDK not found` - Install `npm install @google/generative-ai`
- `Error: Cannot configure destroyed reactive engine` - Don't use after cleanup
- `Error: Streaming not implemented for provider` - Provider doesn't support streaming
- `Error: API request failed` - Network or authentication error

## Best Practices

1. **Always handle errors**: Use `onError` callback and check `lastError`
2. **Use debouncing**: Prevent excessive API calls with `debounce`
3. **Set preventDefault**: Avoid infinite loops when actions modify watched state
4. **Cleanup properly**: The hook handles cleanup automatically
5. **Type your state**: Use TypeScript generics for better type safety
6. **Monitor execution**: Check `isExecuting` to show loading states
7. **Debug mode**: Enable `debug: true` during development