import { ReactiveAction, AIProvider, ActionContext } from '@reactive-ai/core';

/**
 * React-specific types for the Reactive AI SDK
 */

export interface UseReactiveAIConfig<T = any> {
  watch: T[] | (() => T[]);
  providers: Record<string, AIProvider>;
  actions: ReactiveAction<T>[];
  onError?: (error: Error, context: ActionContext<T>) => void;
  debug?: boolean;
  dependencies?: React.DependencyList;
  idle?: {
    timeout: number; // ms to wait before idle
    action: ReactiveAction<T>; // action to execute when idle
    repeat?: boolean; // whether to repeat at intervals
    interval?: number; // interval between repeats (ms)
  };
}

export interface ReactiveAIHookReturn {
  isReady: boolean;
  isExecuting: boolean;
  lastError: Error | null;
  isIdle?: boolean; // true when idle detection is active
  addAction: (action: ReactiveAction) => void;
  removeAction: (actionId: string) => void;
  reset: () => void;
}

export interface StreamingResponseOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface UseStreamingResponseReturn {
  response: string;
  isStreaming: boolean;
  error: Error | null;
  reset: () => void;
  stream: (provider: AIProvider, params: any) => Promise<void>;
}