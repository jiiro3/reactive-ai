import { useState, useMemo } from 'react';
import { useReactiveAI } from '@reactive-ai/react';
import { GeminiProvider } from '@reactive-ai/providers';
import type { AIProvider, StreamChunk, StreamParams, CompleteParams } from '@reactive-ai/core';

// Curious forest sprite personality
const SPRITE_NAME = "Sylvara";
const SPRITE_PERSONALITY = `You are ${SPRITE_NAME}, a curious and ancient forest sprite with glowing emerald eyes and wings that shimmer like moonlight through leaves. You dwell in the Whispering Woods, where magic flows through every root and branch. You are wise yet playful, helpful yet mysterious. You speak with poetic elegance but genuine warmth. You're fascinated by humans and their questions, always eager to help but sometimes distracted by the wonders of your forest home.`;

const IDLE_PROMPTS = [
  "The user seems quiet. As a curious sprite, gently check if they need guidance or have questions about the mystical arts.",
  "The forest whispers that the user might be pondering. Offer a thoughtful observation or magical insight.",
  "Time passes like mist through trees. Share a brief wonder from your forest or ask if they seek knowledge.",
  "The silence grows deep. Perhaps share a riddle or offer to illuminate a mystery they might be considering.",
  "Like a gentle breeze, remind them you're here, perhaps with a mystical fact or ethereal observation."
];

function App() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [triggerCount, setTriggerCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [mode, setMode] = useState<'demo' | 'gemini'>('demo');
  const [providerStatus, setProviderStatus] = useState<string>('Checking...');

  // Demo provider that works without API keys
  class DemoProvider implements AIProvider {
    name = 'demo' as const;
    
    async stream({ messages }: StreamParams): Promise<AsyncIterable<StreamChunk>> {
      const userMessage = messages[messages.length - 1].content;
      const responses = [
        `*The sprite's eyes sparkle with delight* `,
        `"${userMessage}"... what a fascinating thought! `,
        `In my forest, we believe that every question `,
        `holds the seed of its own answer. `,
        `Let the wisdom of the ancient trees guide you... `
      ];
      
      async function* generate(): AsyncIterable<StreamChunk> {
        for (const chunk of responses) {
          yield { content: chunk, done: false };
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        yield { content: '', done: true };
      }
      
      return generate();
    }

    async complete({ prompt }: CompleteParams): Promise<string> {
      return `The sprite ponders: "${prompt}"`;
    }
  }

  // Initialize providers
  const providers = useMemo(() => {
    const providerMap: Record<string, AIProvider> = {
      demo: new DemoProvider()
    };

    // Get Gemini key from environment
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (geminiKey && geminiKey.trim()) {
      try {
        const provider = new GeminiProvider({ 
          apiKey: geminiKey,
          defaultModel: 'gemini-2.0-flash-exp'
        });
        providerMap.gemini = provider;
        setProviderStatus('✅ Gemini 2.0 Flash ready');
      } catch (error: any) {
        setProviderStatus(`❌ Error: ${error.message}`);
      }
    } else {
      setProviderStatus('⚠️ No API key found - Add VITE_GEMINI_API_KEY to .env');
    }

    return providerMap;
  }, []);

  const { isReady, isExecuting, isIdle, lastError } = useReactiveAI({
    watch: [userInput],
    providers,
    actions: [
      {
        id: 'ai-response',
        trigger: (prev, next) => {
          const hasChanged = prev[0] !== next[0];
          const hasContent = next[0].trim().length > 0;
          return hasChanged && hasContent;
        },
        execute: async ({ providers, state }) => {
          const [input] = state;
          setResponse('');
          setTriggerCount(count => count + 1);

          try {
            const activeProvider = providers[mode];
            if (!activeProvider) {
              throw new Error(`${mode} provider not available`);
            }

            const messages = [
              { role: 'system' as const, content: SPRITE_PERSONALITY },
              ...conversationHistory,
              { role: 'user' as const, content: input }
            ];

            const stream = await activeProvider.stream({ messages });

            let fullResponse = '';
            for await (const chunk of stream) {
              fullResponse += chunk.content;
              setResponse(fullResponse);
            }

            // Update conversation history
            setConversationHistory(prev => [
              ...prev,
              { role: 'user', content: input },
              { role: 'assistant', content: fullResponse }
            ].slice(-6)); // Keep last 6 messages
          } catch (error: any) {
            setResponse(`The forest magic wavered: ${error.message}`);
          }
        },
        debounce: 500,
        preventDefault: true
      }
    ],
    // Native idle detection!
    idle: {
      timeout: 5000, // 5 seconds of inactivity
      action: {
        id: 'sprite-pondering',
        trigger: () => true,
        execute: async ({ providers }) => {
          const activeProvider = providers[mode];
          if (!activeProvider) return;

          const idlePrompt = IDLE_PROMPTS[Math.floor(Math.random() * IDLE_PROMPTS.length)];
          const messages = [
            { role: 'system' as const, content: SPRITE_PERSONALITY },
            ...conversationHistory,
            { role: 'user' as const, content: idlePrompt }
          ];

          setResponse('');
          const stream = await activeProvider.stream({ messages });
          
          let fullResponse = '';
          for await (const chunk of stream) {
            fullResponse += chunk.content;
            setResponse(fullResponse);
          }
        }
      },
      repeat: false // Only ponder once per idle period
    },
    debug: true
  });

  const hasGemini = !!providers.gemini;

  // Initial greeting
  useState(() => {
    setTimeout(() => {
      if (isReady) {
        setResponse(`*A shimmer of silver light dances before you as ${SPRITE_NAME} materializes*\n\nGreetings, traveler! I am ${SPRITE_NAME}, guardian sprite of the Whispering Woods. What mysteries shall we explore together today?`);
      }
    }, 1000);
  });

  return (
    <div className="app">
      <div className="forest-bg"></div>
      <div className="fireflies"></div>
      
      <div className="container">
        <header className="header">
          <div className="sprite-glow"></div>
          <h1>The Whispering Woods</h1>
          <p className="subtitle">Commune with {SPRITE_NAME}, the Forest Sprite</p>
        </header>

        <div className="stats">
          <div className="stat">
            <span className="stat-label">Sprite Status</span>
            <span className="stat-value">{isReady ? '✨ Present' : '🌙 Arriving...'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Exchanges</span>
            <span className="stat-value">{triggerCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">State</span>
            <span className="stat-value">
              {isExecuting ? '🦋 Weaving Magic' : isIdle ? '👁️ Observing' : '🍃 Listening'}
            </span>
          </div>
        </div>

        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'demo' ? 'active' : ''}`}
            onClick={() => setMode('demo')}
          >
            🎭 Demo Mode
          </button>
          <button 
            className={`mode-btn ${mode === 'gemini' ? 'active' : ''}`}
            onClick={() => setMode('gemini')}
            disabled={!hasGemini}
            title={hasGemini ? 'Use Gemini 2.0 Flash' : providerStatus}
          >
            ✨ Gemini 2.0 Flash {!hasGemini && '(No API Key)'}
          </button>
        </div>

        {!hasGemini && mode === 'demo' && (
          <div className="status" style={{ marginBottom: '1rem', textAlign: 'center', color: '#888' }}>
            {providerStatus}
          </div>
        )}

        <div className="main">
          <div className="input-section">
            <label htmlFor="user-input">
              Speak your thoughts to the forest...
            </label>
            <textarea
              id="user-input"
              className="input enchanted"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={mode === 'gemini' 
                ? "Ask about magic, nature, or any mystery that intrigues you..."
                : "Share your thoughts... The sprite responds to your words and your silence"
              }
              rows={4}
            />
            <div className="input-hint">
              🌿 {mode === 'gemini' 
                ? `${SPRITE_NAME} listens with the wisdom of Gemini 2.0 Flash`
                : 'The sprite listens to your every word, responding when you pause...'
              }
            </div>
          </div>

          <div className="response-section">
            <h3>{SPRITE_NAME} Speaks</h3>
            <div className={`response-box ${isExecuting ? 'executing' : ''} ${isIdle ? 'pondering' : ''}`}>
              {response || (
                <span className="placeholder">
                  {isExecuting ? `${SPRITE_NAME} gathers ethereal wisdom...` : 'The forest awaits your words...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {lastError && (
          <div className="error-message">
            ⚠️ {lastError.message}
          </div>
        )}

        <footer className="footer">
          <h3>Forest Enchantments:</h3>
          <ul>
            <li>✨ <strong>Living Response</strong> - The sprite reacts as you speak</li>
            <li>🌙 <strong>Thoughtful Presence</strong> - {SPRITE_NAME} ponders when you're quiet</li>
            <li>🦋 <strong>Streaming Wisdom</strong> - Watch mystical words appear like fireflies</li>
            <li>🍃 <strong>Natural Flow</strong> - No buttons, just conversation</li>
            <li>🛡️ <strong>Native Idle Detection</strong> - Built into the Reactive AI SDK</li>
            {mode === 'gemini' && (
              <li>⚡ <strong>Gemini 2.0 Flash</strong> - Google's latest model with 2x speed</li>
            )}
          </ul>
        </footer>
      </div>
    </div>
  );
}

export default App;