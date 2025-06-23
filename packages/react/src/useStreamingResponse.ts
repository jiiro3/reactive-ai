import { useState, useCallback } from 'react';
import { AIProvider } from '@reactive-ai/core';
import { UseStreamingResponseReturn, StreamingResponseOptions } from './types';

/**
 * Hook for handling streaming AI responses
 */
export function useStreamingResponse(
  options: StreamingResponseOptions = {}
): UseStreamingResponseReturn {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stream = useCallback(async (provider: AIProvider, params: any) => {
    if (isStreaming) {
      console.warn('Stream already in progress, ignoring new request');
      return;
    }

    setIsStreaming(true);
    setError(null);
    setResponse('');

    try {
      const streamIterable = await provider.stream(params);
      let fullResponse = '';

      for await (const chunk of streamIterable) {
        fullResponse += chunk.content;
        setResponse(fullResponse);
        options.onChunk?.(chunk.content);

        if (chunk.done) {
          break;
        }
      }

      options.onComplete?.(fullResponse);
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, options]);

  const reset = useCallback(() => {
    setResponse('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    response,
    isStreaming,
    error,
    reset,
    stream
  };
}