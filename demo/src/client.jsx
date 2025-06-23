const { useState, useEffect, useRef } = React;

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

// Simple reactive AI demo with sprite personality
function App() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [isIdle, setIsIdle] = useState(false);
  
  const debounceTimer = useRef(null);
  const idleTimer = useRef(null);
  const ponderingTimer = useRef(null);

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
        // Initial greeting from sprite
        setResponse(`*A shimmer of silver light dances before you as ${SPRITE_NAME} materializes*\n\nGreetings, traveler! I am ${SPRITE_NAME}, guardian sprite of the Whispering Woods. What mysteries shall we explore together today?`);
      } else {
        setError('Failed to load Google Generative AI SDK');
      }
    }, 1000);
  }, []);

  // Track user activity
  const updateActivity = () => {
    setLastInteraction(Date.now());
    setIsIdle(false);
    
    // Clear existing idle timer
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    
    // Set new idle timer (5 seconds)
    idleTimer.current = setTimeout(() => {
      setIsIdle(true);
    }, 5000);
  };

  // Pondering timer - sprite checks in when idle
  useEffect(() => {
    if (!isIdle || !ready || isExecuting) return;

    // Clear any existing pondering timer
    if (ponderingTimer.current) {
      clearInterval(ponderingTimer.current);
    }

    // Ponder immediately when becoming idle
    const ponderNow = async () => {
      if (!isExecuting && apiKey) {
        const idlePrompt = IDLE_PROMPTS[Math.floor(Math.random() * IDLE_PROMPTS.length)];
        await generateResponse(idlePrompt, true);
      }
    };

    // Initial ponder
    ponderNow();

    // Then set up interval for pondering every 5 seconds while idle
    ponderingTimer.current = setInterval(ponderNow, 5000);

    return () => {
      if (ponderingTimer.current) {
        clearInterval(ponderingTimer.current);
      }
    };
  }, [isIdle, ready, isExecuting]);

  // Generate AI response
  const generateResponse = async (prompt, isIdleCheck = false) => {
    if (!apiKey || apiKey === '') {
      setError('No API key found. Please set GEMINI_API_KEY environment variable.');
      return;
    }

    setIsExecuting(true);
    setError('');
    if (!isIdleCheck) {
      setTriggerCount(prev => prev + 1);
    }

    try {
      // Initialize the SDK
      const genAI = new window.GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 200,
        }
      });

      // Build context with sprite personality
      const context = [
        { role: 'user', content: SPRITE_PERSONALITY },
        ...conversationHistory,
        { role: 'user', content: prompt }
      ];

      // Generate streaming response
      const fullPrompt = context.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const result = await model.generateContentStream(fullPrompt);
      
      setResponse(''); // Clear previous response
      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullResponse += text;
        setResponse(fullResponse);
      }

      // Update conversation history
      if (!isIdleCheck) {
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: prompt },
          { role: 'assistant', content: fullResponse }
        ].slice(-6)); // Keep last 6 messages
      }
    } catch (err) {
      setError(`The forest magic wavered: ${err.message}`);
      setResponse('');
    } finally {
      setIsExecuting(false);
    }
  };

  // The magic: React to input changes automatically!
  useEffect(() => {
    if (!ready || !userInput.trim()) return;

    updateActivity();

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer - triggers after 500ms of no typing
    debounceTimer.current = setTimeout(() => {
      generateResponse(userInput);
    }, 500);

    // Cleanup timer
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [userInput, ready]);

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
            <span className="stat-value">{ready ? '✨ Present' : '🌙 Arriving...'}</span>
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

        <div className="main">
          <div className="input-section">
            <label htmlFor="user-input">
              Speak your thoughts to the forest...
            </label>
            <textarea
              id="user-input"
              className="input enchanted"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                updateActivity();
              }}
              placeholder="Ask about magic, nature, or any mystery that intrigues you..."
              disabled={!ready}
              rows={4}
            />
            <div className="input-hint">
              🌿 The sprite listens to your every word, responding when you pause...
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

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <footer className="footer">
          <h3>Forest Enchantments:</h3>
          <ul>
            <li>✨ <strong>Living Response</strong> - The sprite reacts as you speak</li>
            <li>🌙 <strong>Thoughtful Presence</strong> - {SPRITE_NAME} ponders when you're quiet</li>
            <li>🦋 <strong>Streaming Wisdom</strong> - Watch mystical words appear like fireflies</li>
            <li>🍃 <strong>Natural Flow</strong> - No buttons, just conversation</li>
            <li>⚡ <strong>Gemini 2.0 Flash</strong> - Powered by swift magic</li>
          </ul>
        </footer>
      </div>
    </div>
  );
}

// Mount the app
ReactDOM.createRoot(document.getElementById('root')).render(<App />);