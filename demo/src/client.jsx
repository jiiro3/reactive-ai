const { useState, useEffect, useRef } = React;

// Simple reactive AI demo that responds automatically as you type
function App() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);
  const debounceTimer = useRef(null);

  // API key will be injected by the server
  const apiKey = process.env.GEMINI_API_KEY;

  useEffect(() => {
    // Load Google Generative AI SDK
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';
      window.GoogleGenerativeAI = GoogleGenerativeAI;
    `;
    document.head.appendChild(script);
    
    // Wait a bit for the module to load
    setTimeout(() => {
      if (window.GoogleGenerativeAI) {
        setReady(true);
      } else {
        setError('Failed to load Google Generative AI SDK');
      }
    }, 1000);
  }, []);

  // The magic: React to input changes automatically!
  useEffect(() => {
    if (!ready || !userInput.trim()) return;

    // Check if API key is available
    if (!apiKey || apiKey === '') {
      setError('No API key found. Please set GEMINI_API_KEY environment variable.');
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer - triggers after 500ms of no typing
    debounceTimer.current = setTimeout(async () => {
      setIsExecuting(true);
      setError('');
      setTriggerCount(prev => prev + 1);

      try {
        // Initialize the SDK
        const genAI = new window.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.7,
          }
        });

        // Generate streaming response
        const result = await model.generateContentStream(userInput);
        
        setResponse(''); // Clear previous response
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const text = chunk.text();
          fullResponse += text;
          setResponse(fullResponse);
        }
      } catch (err) {
        setError(`Streaming failed: ${err.message}`);
        setResponse('');
      } finally {
        setIsExecuting(false);
      }
    }, 500); // 500ms debounce - same as the original demo

    // Cleanup timer
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [userInput, ready, apiKey]);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Reactive AI SDK Demo</h1>
          <p className="subtitle">Watch AI respond automatically as you type</p>
        </header>

        <div className="stats">
          <div className="stat">
            <span className="stat-label">Status</span>
            <span className="stat-value">{ready ? '✅ Ready' : '⏳ Loading...'}</span>
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

        <div className="main">
          <div className="input-section">
            <label htmlFor="user-input">
              Ask Gemini 2.0 Flash anything:
            </label>
            <textarea
              id="user-input"
              className="input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Start typing... The AI will respond after you pause for 500ms"
              disabled={!ready}
              rows={4}
            />
            <div className="input-hint">
              💡 The SDK watches your input and automatically triggers actions when you stop typing
            </div>
          </div>

          <div className="response-section">
            <h3>Gemini 2.0 Flash Response</h3>
            <div className={`response-box ${isExecuting ? 'executing' : ''}`}>
              {response || (
                <span className="placeholder">
                  {isExecuting ? 'Processing...' : 'Responses will appear here automatically'}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <footer className="footer">
          <h3>How it works:</h3>
          <ul>
            <li>✨ <strong>Reactive State Monitoring</strong> - Watches your input in real-time</li>
            <li>⏱️ <strong>Smart Debouncing</strong> - Waits 500ms after you stop typing</li>
            <li>🚀 <strong>Automatic Triggering</strong> - No buttons needed, just type!</li>
            <li>🌊 <strong>Streaming Support</strong> - See responses appear word by word</li>
            <li>⚡ <strong>Gemini 2.0 Flash</strong> - Google's latest model with 2x speed</li>
          </ul>
        </footer>
      </div>
    </div>
  );
}

// Mount the app
ReactDOM.createRoot(document.getElementById('root')).render(<App />);