import { AIProvider, StreamParams, StreamChunk, CompleteParams } from '@reactive-ai/core';

/**
 * Custom provider for implementing your own AI service
 */
export interface CustomProviderConfig {
  name: string;
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface CustomStreamFunction {
  (params: StreamParams): Promise<AsyncIterable<StreamChunk>>;
}

export interface CustomCompleteFunction {
  (params: CompleteParams): Promise<string>;
}

export class CustomProvider implements AIProvider {
  public readonly name: string;
  private config: CustomProviderConfig;
  private streamFn?: CustomStreamFunction;
  private completeFn?: CustomCompleteFunction;

  constructor(
    config: CustomProviderConfig,
    streamFn?: CustomStreamFunction,
    completeFn?: CustomCompleteFunction
  ) {
    this.name = config.name;
    this.config = {
      timeout: 30000,
      ...config
    };
    this.streamFn = streamFn;
    this.completeFn = completeFn;
  }

  async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    if (!this.streamFn) {
      throw new Error(`Streaming not implemented for provider: ${this.name}`);
    }

    try {
      const stream = await this.streamFn(params);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      throw new Error(`Custom provider streaming failed: ${error.message}`);
    }
  }

  async complete(params: CompleteParams): Promise<string> {
    if (!this.completeFn) {
      throw new Error(`Completion not implemented for provider: ${this.name}`);
    }

    try {
      return await this.completeFn(params);
    } catch (error) {
      throw new Error(`Custom provider completion failed: ${error.message}`);
    }
  }
}

/**
 * Create a custom provider for API endpoints
 */
export function createAPIProvider(config: CustomProviderConfig): CustomProvider {
  const streamFn: CustomStreamFunction = async function* (params: StreamParams) {
    const response = await fetch(`${config.baseURL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(config.timeout || 30000)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            yield {
              content: data.content || '',
              done: data.done || false,
              metadata: data.metadata
            };
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const completeFn: CustomCompleteFunction = async (params: CompleteParams) => {
    const response = await fetch(`${config.baseURL}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(config.timeout || 30000)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content || data.response || '';
  };

  return new CustomProvider(config, streamFn, completeFn);
}

/**
 * Factory function for creating custom providers
 */
export function createCustomProvider(
  config: CustomProviderConfig,
  streamFn?: CustomStreamFunction,
  completeFn?: CustomCompleteFunction
): CustomProvider {
  return new CustomProvider(config, streamFn, completeFn);
}