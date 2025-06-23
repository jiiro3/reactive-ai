import { AIProvider, StreamParams, StreamChunk, CompleteParams } from '@reactive-ai/core';

/**
 * OpenAI provider implementation
 */
export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  defaultModel?: string;
  timeout?: number;
}

export class OpenAIProvider implements AIProvider {
  public readonly name = 'openai';
  private client: any; // OpenAI client
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      defaultModel: 'gpt-3.5-turbo',
      timeout: 30000,
      ...config
    };
    
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      // Dynamic import to avoid requiring OpenAI SDK if not used
      const OpenAI = require('openai');
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
        organization: this.config.organization,
        project: this.config.project,
        timeout: this.config.timeout
      });
    } catch (error) {
      throw new Error(
        'OpenAI SDK not found. Please install it with: npm install openai'
      );
    }
  }

  async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const {
      messages,
      model = this.config.defaultModel,
      temperature = 0.7,
      maxTokens,
      ...otherParams
    } = params;

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        ...otherParams
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content || '';
        const done = chunk.choices[0]?.finish_reason !== null;

        yield {
          content,
          done,
          metadata: {
            model,
            finishReason: chunk.choices[0]?.finish_reason,
            usage: chunk.usage
          }
        };

        if (done) break;
      }
    } catch (error) {
      throw new Error(`OpenAI streaming failed: ${error.message}`);
    }
  }

  async complete(params: CompleteParams): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const {
      prompt,
      model = this.config.defaultModel,
      temperature = 0.7,
      maxTokens,
      ...otherParams
    } = params;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        ...otherParams
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`OpenAI completion failed: ${error.message}`);
    }
  }
}

/**
 * Factory function for creating OpenAI provider
 */
export function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}

/**
 * Convenience function for common OpenAI usage
 */
export function openai(config: OpenAIConfig): OpenAIProvider {
  return createOpenAIProvider(config);
}