/**
 * Multi-Provider Example
 * Demonstrates using multiple AI providers with fallback logic
 */

import React, { useState } from 'react';
import { useReactiveAI } from '@reactive-ai/react';
import { openai, gemini } from '@reactive-ai/providers';

export function MultiProviderChat() {
  const [userInput, setUserInput] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini' | 'both'>('both');
  const [isStreaming, setIsStreaming] = useState<Record<string, boolean>>({});

  const { isReady, isExecuting, lastError } = useReactiveAI({
    watch: [userInput, selectedProvider],
    providers: {
      openai: openai({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY!,
        defaultModel: 'gpt-3.5-turbo'
      }),
      gemini: gemini({
        apiKey: process.env.REACT_APP_GEMINI_API_KEY!,
        defaultModel: 'gemini-1.5-flash'
      })
    },
    actions: [
      {
        id: 'openai-response',
        trigger: (prev, next) => {
          const inputChanged = prev[0] !== next[0] && next[0].trim().length > 0;
          const providerMatches = next[1] === 'openai' || next[1] === 'both';
          return inputChanged && providerMatches;
        },
        execute: async ({ providers, state }) => {
          const [input] = state;
          setIsStreaming(prev => ({ ...prev, openai: true }));
          setResponses(prev => ({ ...prev, openai: '' }));

          try {
            const stream = await providers.openai.stream({
              messages: [
                { role: 'system', content: 'You are a helpful assistant. Be concise.' },
                { role: 'user', content: input }
              ]
            });

            let fullResponse = '';
            for await (const chunk of stream) {
              fullResponse += chunk.content;
              setResponses(prev => ({ ...prev, openai: fullResponse }));
            }
          } catch (error) {
            setResponses(prev => ({ 
              ...prev, 
              openai: `Error: ${error.message}` 
            }));
          } finally {
            setIsStreaming(prev => ({ ...prev, openai: false }));
          }
        },
        preventDefault: true
      },
      {
        id: 'gemini-response',
        trigger: (prev, next) => {
          const inputChanged = prev[0] !== next[0] && next[0].trim().length > 0;
          const providerMatches = next[1] === 'gemini' || next[1] === 'both';
          return inputChanged && providerMatches;
        },
        execute: async ({ providers, state }) => {
          const [input] = state;
          setIsStreaming(prev => ({ ...prev, gemini: true }));
          setResponses(prev => ({ ...prev, gemini: '' }));

          try {
            const stream = await providers.gemini.stream({
              messages: [
                { role: 'system', content: 'You are a helpful assistant. Be concise.' },
                { role: 'user', content: input }
              ]
            });

            let fullResponse = '';
            for await (const chunk of stream) {
              fullResponse += chunk.content;
              setResponses(prev => ({ ...prev, gemini: fullResponse }));
            }
          } catch (error) {
            setResponses(prev => ({ 
              ...prev, 
              gemini: `Error: ${error.message}` 
            }));
          } finally {
            setIsStreaming(prev => ({ ...prev, gemini: false }));
          }
        },
        preventDefault: true
      }
    ],
    debounce: 500,
    debug: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClear = () => {
    setUserInput('');
    setResponses({});
    setIsStreaming({});
  };

  if (!isReady) {
    return <div>Initializing providers...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1>Multi-Provider AI Chat</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a question to compare AI responses..."
            rows={3}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="radio"
              value="openai"
              checked={selectedProvider === 'openai'}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
            />
            OpenAI only
          </label>
          <label style={{ marginLeft: '15px' }}>
            <input
              type="radio"
              value="gemini"
              checked={selectedProvider === 'gemini'}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
            />
            Gemini only
          </label>
          <label style={{ marginLeft: '15px' }}>
            <input
              type="radio"
              value="both"
              checked={selectedProvider === 'both'}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
            />
            Compare both
          </label>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <button type="submit" disabled={isExecuting || !userInput.trim()}>
            {isExecuting ? 'Processing...' : 'Ask'}
          </button>
          <button type="button" onClick={handleClear} style={{ marginLeft: '10px' }}>
            Clear
          </button>
        </div>
      </form>

      {lastError && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {lastError.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {(selectedProvider === 'openai' || selectedProvider === 'both') && (
          <div style={{ flex: 1 }}>
            <h3>OpenAI Response</h3>
            <div style={{ 
              border: '1px solid #ccc', 
              padding: '15px', 
              borderRadius: '5px',
              backgroundColor: '#f8f9fa',
              minHeight: '200px'
            }}>
              {responses.openai && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {responses.openai}
                  {isStreaming.openai && <span style={{ opacity: 0.5 }}>▋</span>}
                </div>
              )}
              {isStreaming.openai && !responses.openai && (
                <div style={{ opacity: 0.5 }}>Thinking...</div>
              )}
            </div>
          </div>
        )}

        {(selectedProvider === 'gemini' || selectedProvider === 'both') && (
          <div style={{ flex: 1 }}>
            <h3>Gemini Response</h3>
            <div style={{ 
              border: '1px solid #ccc', 
              padding: '15px', 
              borderRadius: '5px',
              backgroundColor: '#f0f8ff',
              minHeight: '200px'
            }}>
              {responses.gemini && (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {responses.gemini}
                  {isStreaming.gemini && <span style={{ opacity: 0.5 }}>▋</span>}
                </div>
              )}
              {isStreaming.gemini && !responses.gemini && (
                <div style={{ opacity: 0.5 }}>Thinking...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedProvider === 'both' && responses.openai && responses.gemini && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h4>Comparison Notes:</h4>
          <ul>
            <li>OpenAI response length: {responses.openai.length} characters</li>
            <li>Gemini response length: {responses.gemini.length} characters</li>
            <li>Both responses completed at: {new Date().toLocaleTimeString()}</li>
          </ul>
        </div>
      )}
    </div>
  );
}