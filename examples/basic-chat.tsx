/**
 * Basic Chat Example
 * Demonstrates simple reactive AI chat functionality
 */

import React, { useState } from 'react';
import { useReactiveAI } from '@reactive-ai/react';
import { openai } from '@reactive-ai/providers';

export function BasicChat() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { isReady, isExecuting, lastError } = useReactiveAI({
    watch: [userInput],
    providers: {
      openai: openai({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY!,
        defaultModel: 'gpt-3.5-turbo'
      })
    },
    actions: [
      {
        id: 'chat-response',
        trigger: (prev, next) => {
          // Trigger when user input changes and has content
          return prev[0] !== next[0] && next[0].trim().length > 0;
        },
        execute: async ({ providers, state }) => {
          const [input] = state;
          setIsTyping(true);
          setResponse('');

          try {
            const stream = await providers.openai.stream({
              messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: input }
              ]
            });

            let fullResponse = '';
            for await (const chunk of stream) {
              fullResponse += chunk.content;
              setResponse(fullResponse);
            }
          } finally {
            setIsTyping(false);
          }
        },
        preventDefault: true, // Prevent triggering while already executing
        debounce: 500 // Wait 500ms after user stops typing
      }
    ],
    debug: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The reactive system will handle the response automatically
    // when userInput changes
  };

  const handleClear = () => {
    setUserInput('');
    setResponse('');
  };

  if (!isReady) {
    return <div>Initializing...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Basic Chat Example</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            rows={3}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <button type="submit" disabled={isExecuting || !userInput.trim()}>
            {isExecuting ? 'Thinking...' : 'Send'}
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

      {(response || isTyping) && (
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '15px', 
          borderRadius: '5px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Assistant:</h3>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {response}
            {isTyping && <span style={{ opacity: 0.5 }}>▋</span>}
          </div>
        </div>
      )}
    </div>
  );
}