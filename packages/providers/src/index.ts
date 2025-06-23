/**
 * Reactive AI SDK Providers
 * AI provider implementations for OpenAI, Gemini, and custom services
 */

// OpenAI provider
export {
  OpenAIProvider,
  createOpenAIProvider,
  openai,
  type OpenAIConfig
} from './openai';

// Gemini provider
export {
  GeminiProvider,
  createGeminiProvider,
  gemini,
  type GeminiConfig
} from './gemini';

// Custom provider
export {
  CustomProvider,
  createCustomProvider,
  createAPIProvider,
  type CustomProviderConfig,
  type CustomStreamFunction,
  type CustomCompleteFunction
} from './custom';

// Re-export core types for convenience
export type {
  AIProvider,
  StreamParams,
  StreamChunk,
  CompleteParams,
  Message
} from '@reactive-ai/core';