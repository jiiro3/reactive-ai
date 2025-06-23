import { AIProvider, StreamParams, StreamChunk, CompleteParams } from '@reactive-ai/core';

/**
 * Gemini provider implementation
 */
export interface GeminiConfig {
  apiKey: string;
  defaultModel?: string;
  timeout?: number;
  safetySettings?: any[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private genAI: any; // GoogleGenerativeAI instance
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      defaultModel: 'gemini-1.5-flash',
      timeout: 30000,
      ...config
    };
    
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      // Dynamic import to avoid requiring Gemini SDK if not used
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    } catch (error) {
      throw new Error(
        'Google Generative AI SDK not found. Please install it with: npm install @google/generative-ai'
      );
    }
  }

  async stream(params: StreamParams): Promise<AsyncIterable<StreamChunk>> {
    const self = this;
    
    async function* generateStream(): AsyncIterable<StreamChunk> {
      if (!self.genAI) {
        throw new Error('Gemini client not initialized');
      }

      const {
        messages,
        model = self.config.defaultModel,
        temperature = 0.7,
        maxTokens,
        ...otherParams
      } = params;

      try {
        const genModel = self.genAI.getGenerativeModel({
          model,
          safetySettings: self.config.safetySettings,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...self.config.generationConfig,
            ...otherParams
          }
        });

        // Convert messages to Gemini format
        const prompt = self.convertMessagesToPrompt(messages);
        
        const result = await genModel.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          
          yield {
            content: text,
            done: false,
            metadata: {
              model,
              candidates: chunk.candidates
            }
          };
        }

        // Final chunk to indicate completion
        yield {
          content: '',
          done: true,
          metadata: { model }
        };
      } catch (error: any) {
        throw new Error(`Gemini streaming failed: ${error.message}`);
      }
    }
    
    return generateStream();
  }

  async complete(params: CompleteParams): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini client not initialized');
    }

    const {
      prompt,
      model = this.config.defaultModel,
      temperature = 0.7,
      maxTokens,
      ...otherParams
    } = params;

    try {
      const genModel = this.genAI.getGenerativeModel({
        model,
        safetySettings: this.config.safetySettings,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...this.config.generationConfig,
          ...otherParams
        }
      });

      const result = await genModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Gemini completion failed: ${error.message}`);
    }
  }

  private convertMessagesToPrompt(messages: any[]): string {
    // Simple conversion - in production you might want more sophisticated handling
    return messages
      .map(msg => {
        const role = msg.role === 'assistant' ? 'Model' : 'Human';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }
}

/**
 * Factory function for creating Gemini provider
 */
export function createGeminiProvider(config: GeminiConfig): GeminiProvider {
  return new GeminiProvider(config);
}

/**
 * Convenience function for common Gemini usage
 */
export function gemini(config: GeminiConfig): GeminiProvider {
  return createGeminiProvider(config);
}