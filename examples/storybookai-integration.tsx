/**
 * StorybookAI Integration Example
 * Shows how to integrate with StorybookAI's character chat system
 */

import React, { useState } from 'react';
import { useReactiveAI } from '@reactive-ai/react';
import { createCustomProvider } from '@reactive-ai/providers';

interface CharacterState {
  mood: string;
  energy: number;
  lastInteraction: string;
}

interface StorybookAIProps {
  characterId: string;
  userId: string;
  apiUrl: string;
}

export function StorybookAICharacterChat({ characterId, userId, apiUrl }: StorybookAIProps) {
  const [userMessage, setUserMessage] = useState('');
  const [characterResponse, setCharacterResponse] = useState('');
  const [characterState, setCharacterState] = useState<CharacterState>({
    mood: 'neutral',
    energy: 5,
    lastInteraction: ''
  });

  const { isReady, isExecuting, lastError } = useReactiveAI({
    watch: [userMessage, characterState],
    providers: {
      storybookai: createCustomProvider(
        {
          name: 'storybookai',
          baseURL: apiUrl,
          headers: {
            'Content-Type': 'application/json'
          }
        },
        // Custom stream function for StorybookAI API
        async function* (params) {
          const response = await fetch(`${apiUrl}/character/${characterId}/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId,
              message: params.messages[params.messages.length - 1]?.content,
              context: {
                mood: characterState.mood,
                energy: characterState.energy
              }
            })
          });

          if (!response.body) throw new Error('No response stream');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter(line => line.trim());

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.type === 'content') {
                      yield {
                        content: data.content,
                        done: false
                      };
                    } else if (data.type === 'state_update') {
                      // Update character state based on AI response
                      setCharacterState(prev => ({
                        ...prev,
                        ...data.state
                      }));
                    } else if (data.type === 'done') {
                      yield {
                        content: '',
                        done: true
                      };
                    }
                  } catch (e) {
                    console.warn('Failed to parse stream data:', e);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      )
    },
    actions: [
      {
        id: 'character-response',
        trigger: (prev, next) => {
          // Trigger when user message changes
          return prev[0] !== next[0] && next[0].trim().length > 0;
        },
        execute: async ({ providers, state }) => {
          const [message] = state;
          setCharacterResponse('');

          const stream = await providers.storybookai.stream({
            messages: [{ role: 'user', content: message }]
          });

          let fullResponse = '';
          for await (const chunk of stream) {
            if (chunk.content) {
              fullResponse += chunk.content;
              setCharacterResponse(fullResponse);
            }
          }

          // Update last interaction
          setCharacterState(prev => ({
            ...prev,
            lastInteraction: new Date().toISOString()
          }));
        },
        preventDefault: true,
        debounce: 300
      },
      {
        id: 'mood-reaction',
        trigger: (prev, next) => {
          // Trigger when character mood changes significantly
          const prevMood = prev[1]?.mood;
          const nextMood = next[1]?.mood;
          return prevMood !== nextMood && nextMood !== 'neutral';
        },
        execute: async ({ state }) => {
          const [, charState] = state;
          console.log(`Character mood changed to: ${charState.mood}`);
          
          // Could trigger additional AI responses based on mood
          // or update UI to reflect character's emotional state
        }
      }
    ],
    onError: (error, context) => {
      console.error('Reactive AI error:', error);
      // Could send error metrics to StorybookAI analytics
    },
    debug: process.env.NODE_ENV === 'development'
  });

  const handleSendMessage = () => {
    if (userMessage.trim()) {
      // The reactive system will automatically handle the response
      // Clear input after sending
      setTimeout(() => setUserMessage(''), 100);
    }
  };

  if (!isReady) {
    return <div>Connecting to character...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Chat area */}
        <div style={{ flex: 1 }}>
          <h2>Chat with Character</h2>
          
          <div style={{ 
            border: '1px solid #ccc', 
            height: '400px', 
            padding: '15px',
            overflowY: 'auto',
            marginBottom: '10px'
          }}>
            {characterResponse && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Character:</strong>
                <div style={{ 
                  marginTop: '5px',
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '5px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {characterResponse}
                  {isExecuting && <span style={{ opacity: 0.5 }}>▋</span>}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: '10px' }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isExecuting || !userMessage.trim()}
            >
              Send
            </button>
          </div>

          {lastError && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Error: {lastError.message}
            </div>
          )}
        </div>

        {/* Character state panel */}
        <div style={{ width: '200px' }}>
          <h3>Character State</h3>
          <div style={{ 
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '5px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Mood:</strong> {characterState.mood}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Energy:</strong> {characterState.energy}/10
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Status:</strong> {isExecuting ? 'Thinking...' : 'Ready'}
            </div>
            {characterState.lastInteraction && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Last interaction: {new Date(characterState.lastInteraction).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}