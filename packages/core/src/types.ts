/**
 * Core types for the Reactive AI SDK
 */

export interface AIProvider {
  name: string;
  stream(params: StreamParams): Promise<AsyncIterable<StreamChunk>>;
  complete?(params: CompleteParams): Promise<string>;
}

export interface StreamParams {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

export interface CompleteParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  content: string;
  done?: boolean;
  metadata?: Record<string, any>;
}

export interface ActionContext<T = any> {
  state: T;
  providers: Record<string, AIProvider>;
  metadata: {
    trigger: string;
    timestamp: number;
    previousState?: T;
  };
}

export interface ReactiveAction<T = any> {
  id?: string;
  trigger: TriggerFunction<T>;
  execute: ActionFunction<T>;
  preventDefault?: boolean;
  debounce?: number;
  throttle?: number;
  conditions?: ConditionFunction<T>[];
}

export type TriggerFunction<T = any> = (
  previousState: T, 
  currentState: T, 
  metadata: { timestamp: number }
) => boolean;

export type ActionFunction<T = any> = (
  context: ActionContext<T>
) => Promise<void> | void;

export type ConditionFunction<T = any> = (
  context: ActionContext<T>
) => boolean;

export interface ReactiveConfig<T = any> {
  state: T;
  providers: Record<string, AIProvider>;
  actions: ReactiveAction<T>[];
  onError?: (error: Error, context: ActionContext<T>) => void;
  debug?: boolean;
}

export interface StateWatcher<T = any> {
  watch(state: T): void;
  onChange(callback: (newState: T, oldState: T) => void): void;
  unwatch(): void;
}

export interface ReactiveEngine<T = any> {
  configure(config: ReactiveConfig<T>): void;
  updateState(newState: T): Promise<void>;
  addAction(action: ReactiveAction<T>): void;
  removeAction(actionId: string): void;
  destroy(): void;
}