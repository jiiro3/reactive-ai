import { useState, useMemo } from 'react';
import { useReactiveAI } from '@reactive-ai/react';
import { GeminiProvider } from '@reactive-ai/providers';
import type { AIProvider, StreamChunk, StreamParams, CompleteParams } from '@reactive-ai/core';

function App() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [triggerCount, setTriggerCount] = useState(0);
  const [mode, setMode] = useState<'demo' | 'gemini'>('demo');
  const [providerStatus, setProviderStatus] = useState<string>('Checking...');

  // Demo provider that works without API keys
  class DemoProvider implements AIProvider {
    name = 'demo' as const;
    
    async stream({ messages }: StreamParams): Promise<AsyncIterable<StreamChunk>> {
      const userMessage = messages[messages.length - 1].content;
      const responses = [
        `I see you typed: "${userMessage}". `,
        `This is a streaming response `,
        `from the Reactive AI SDK demo. `,
        `The SDK automatically triggers `,
        `AI responses when you stop typing! `
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
      return `Complete response for: "${prompt}"`;
    }
  }

  // Initialize providers
  const providers = useMemo(() => {
    const providerMap: Record<string, AIProvider> = {
      demo: new DemoProvider()
    };

    // Get Gemini key from environment
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    console.log('Gemini key check:', {
      exists: !!geminiKey,
      length: geminiKey?.length || 0,
      preview: geminiKey ? geminiKey.substring(0, 20) + '...' : 'NOT FOUND'
    });

    if (geminiKey && geminiKey.trim()) {
      try {
        console.log('Creating Gemini provider...');
        const provider = new GeminiProvider({ 
          apiKey: geminiKey,
          defaultModel: 'gemini-2.0-flash-exp'
        });
        providerMap.gemini = provider;
        setProviderStatus('✅ Gemini 2.0 Flash ready');
        console.log('Gemini provider created successfully!');
      } catch (error: any) {
        console.error('Failed to initialize Gemini provider:', error);
        setProviderStatus(`❌ Error: ${error.message}`);
      }
    } else {
      console.log('No Gemini API key found');
      setProviderStatus('⚠️ No API key found - Add VITE_GEMINI_API_KEY to .env');
    }

    return providerMap;
  }, []);

  const { isReady, isExecuting, lastError } = useReactiveAI({
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
              { role: 'system' as const, content: 'You are a helpful assistant. Be concise and friendly.' },
              { role: 'user' as const, content: input }
            ];

            const stream = await activeProvider.stream({ messages });

            let fullResponse = '';
            for await (const chunk of stream) {
              fullResponse += chunk.content;
              setResponse(fullResponse);
            }
          } catch (error: any) {
            console.error('Streaming error:', error);
            setResponse(`Error: ${error.message}`);
          }
        },
        debounce: 500,
        preventDefault: true
      }
    ],
    debug: true
  });

  const hasGemini = !!providers.gemini;

  return (
    <div className="container">
      <header className="header">
        <h1>Reactive AI SDK</h1>
        <p className="subtitle">Watch AI respond automatically as you type</p>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Status</span>
          <span className="stat-value">{isReady ? '✅ Ready' : '⏳ Loading...'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Triggers</span>
          <span className="stat-value">{triggerCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">State</span>
          <span className="stat-value">{isExecuting ? '🤖 Processing' : '⏸️ Waiting'}</span>
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
        <div className="status" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          {providerStatus}
        </div>
      )}

      <div className="main">
        <div className="input-section">
          <label htmlFor="user-input">
            {mode === 'gemini' ? 'Ask Gemini 2.0 Flash anything:' : 'Type something and watch the magic happen:'}
          </label>
          <textarea
            id="user-input"
            className="input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={mode === 'gemini' 
              ? "Ask me anything! I'll respond using Gemini 2.0 Flash after you pause..."
              : "Start typing... The AI will respond after you pause for 500ms"
            }
            rows={4}
          />
          <div className="input-hint">
            💡 {mode === 'gemini' 
              ? 'Using Gemini 2.0 Flash - The latest and fastest model from Google'
              : 'The SDK watches your input and automatically triggers actions when you stop typing'
            }
          </div>
        </div>

        <div className="response-section">
          <h3>{mode === 'gemini' ? 'Gemini 2.0 Flash Response' : 'AI Response'}</h3>
          <div className={`response-box ${isExecuting ? 'executing' : ''}`}>
            {response || (
              <span className="placeholder">
                {isExecuting ? 'Processing...' : 'Responses will appear here automatically'}
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
        <h3>How it works:</h3>
        <ul>
          <li>✨ <strong>Reactive State Monitoring</strong> - Watches your input in real-time</li>
          <li>⏱️ <strong>Smart Debouncing</strong> - Waits 500ms after you stop typing</li>
          <li>🚀 <strong>Automatic Triggering</strong> - No buttons needed, just type!</li>
          <li>🌊 <strong>Streaming Support</strong> - See responses appear word by word</li>
          <li>🛡️ <strong>Loop Prevention</strong> - Prevents infinite trigger loops</li>
          {mode === 'gemini' && (
            <li>⚡ <strong>Gemini 2.0 Flash</strong> - Google's latest model with 2x speed improvement</li>
          )}
        </ul>
      </footer>
    </div>
  );
}

export default App;