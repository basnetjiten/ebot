import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

// Icons
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Define types
interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  analysis?: AnalysisResult;
}

interface AnalysisResult {
  summary: string;
  feedback: string;
  mood?: string;
  goals?: string[];
  moodEmoji?: string;
  keyInsights?: string[];
}

interface ReflectionPayload {
  userId: string;
  type: 'morning' | 'evening';
  content: string;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😐',
  excited: '🤩',
  grateful: '🙏',
  tired: '😴',
  productive: '💪',
  stressed: '😫',
  relaxed: '😌',
  motivated: '🔥'
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reflectionType, setReflectionType] = useState<'morning' | 'evening'>('morning');
  const [finalAnalysis, setFinalAnalysis] = useState<AnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const saveStatusRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (saveStatus) {
      saveStatusRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [saveStatus]);

  const addMessage = (sender: 'user' | 'bot', content: string, analysis?: AnalysisResult) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      content,
      timestamp: new Date(),
      analysis
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = input.trim();
    if (!userInput) return;

    // Add user message
    addMessage('user', userInput);
    setInput('');
    setIsSubmitting(true);

    const payload: ReflectionPayload = {
      userId: 'user1',
      type: reflectionType,
      content: userInput,
    };

    try {
      const response = await axios.post('http://localhost:3000/api/reflections', payload);
      const analysis: AnalysisResult = response.data.data.analysis;

      // Add mood emoji if mood is detected
      if (analysis.mood) {
        const moodKey = analysis.mood.toLowerCase();
        analysis.moodEmoji = moodEmojis[moodKey] || '🤔';
      }

      addMessage('bot', analysis.feedback, analysis);
      setFinalAnalysis(analysis);
    } catch (error) {
      addMessage('bot', 'Sorry, I encountered an error. Please try again.');
      console.error('Error submitting reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!finalAnalysis) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const payload = {
        userId: 'user1',
        type: reflectionType,
        content: messages.filter(m => m.sender === 'user').map(m => m.content).join('\n'),
        analysis: finalAnalysis,
        timestamp: new Date().toISOString()
      };

      // Save the reflection to the server
      await axios.post('http://localhost:3000/api/reflections/save', payload);

      setSaveStatus({
        success: true,
        message: 'Reflection saved successfully!'
      });

      // Add a small delay before showing the summary
      setTimeout(() => {
        setIsCompleted(true);
      }, 1000);

    } catch (error) {
      console.error('Error saving reflection:', error);
      setSaveStatus({
        success: false,
        message: 'Failed to save reflection. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewChat = () => {
    setIsCompleted(false);
    setMessages([]);
    setFinalAnalysis(null);
  };

  const getPlaceholder = () => {
    return reflectionType === 'morning'
      ? 'Share your thoughts, goals, and intentions for today...'
      : 'Reflect on your day, achievements, and things you\'re grateful for...';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app">
      <div className="chat-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Reflection Journal</h2>
            <div className="reflection-type-selector">
              <span className={`type-option ${reflectionType === 'morning' ? 'active' : ''}`}
                onClick={() => setReflectionType('morning')}>
                ☀️ Morning
              </span>
              <span className={`type-option ${reflectionType === 'evening' ? 'active' : ''}`}
                onClick={() => setReflectionType('evening')}>
                🌙 Evening
              </span>
            </div>
          </div>

          {!isCompleted && finalAnalysis && (
            <button onClick={handleComplete} className="complete-button">
              <CheckIcon /> Complete Reflection
            </button>
          )}

          {isCompleted && (
            <div className="completion-actions">
              <button onClick={handleNewChat} className="new-chat-button">
                Start New Reflection
              </button>
              {finalAnalysis?.keyInsights && (
                <div className="key-insights">
                  <h3>Key Insights</h3>
                  <div className="insights-grid">
                    {finalAnalysis.keyInsights.map((insight: string, i: number) => (
                      <div key={i} className="insight-card">
                        <div className="insight-emoji">💡</div>
                        <p>{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="main-content">
          {!isCompleted ? (
            <>
              <div className="chat-header">
                <h2>{reflectionType === 'morning' ? '☀️ Morning Reflection' : '🌙 Evening Reflection'}</h2>
              </div>

              {/* Floating Finish Button */}
              {messages.length > 0 && !isCompleted && (
                <div className="floating-finish-container">
                  <button
                    onClick={handleComplete}
                    className="floating-finish-button"
                    disabled={isSaving || !finalAnalysis}
                  >
                    <CheckIcon />
                    <span>{isSaving ? 'Saving...' : 'Finish Entry'}</span>
                  </button>
                </div>
              )}
              {saveStatus && (
                <div ref={saveStatusRef} className={`status-message ${saveStatus.success ? 'success' : 'error'}`}>
                  {saveStatus.message}
                </div>
              )}
              <div className="chat-window">
                {messages.length === 0 ? (
                  <div className="welcome-message">
                    <h2>Welcome to your {reflectionType} reflection</h2>
                    <p>Start by sharing your thoughts, and I'll help you reflect on your {reflectionType === 'morning' ? 'day ahead' : 'day'}.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`message-container ${msg.sender}`}>
                      <div className={`message ${msg.sender}`}>
                        <div className="message-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                        <div className="message-time">{formatTime(msg.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
                {isSubmitting && (
                  <div className="message-container bot">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="chat-input-container">
                <div className="input-wrapper">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    rows={1}
                    className="chat-input"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="send-button"
                    disabled={isSubmitting || !input.trim()}
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="summary-view">
              <div className="summary-card">
                <h2>Your {reflectionType === 'morning' ? 'Morning' : 'Evening'} Reflection</h2>

                <div className="mood-display">
                  <div className="mood-emoji">
                    {finalAnalysis?.moodEmoji || '🤔'}
                  </div>
                  <h3>Mood: {finalAnalysis?.mood || 'Neutral'}</h3>
                </div>

                <div className="summary-section">
                  <h3>Summary</h3>
                  <div className="summary-content">
                    {finalAnalysis?.summary || 'No summary available.'}
                  </div>
                </div>

                {finalAnalysis?.goals && finalAnalysis.goals.length > 0 && (
                  <div className="goals-section">
                    <h3>Your Goals</h3>
                    <ul className="goals-list">
                      {finalAnalysis.goals.map((goal: string, i: number) => (
                        <li key={i} className="goal-item">
                          <span className="goal-checkbox"></span>
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="key-insights">
                  <h3>Key Insights</h3>
                  <div className="insights-grid">
                    <div className="insight-card">
                      <div className="insight-emoji">💡</div>
                      <p>Reflect on your progress tomorrow</p>
                    </div>
                    <div className="insight-card">
                      <div className="insight-emoji">🎯</div>
                      <p>Focus on one key goal</p>
                    </div>
                    <div className="insight-card">
                      <div className="insight-emoji">🧘</div>
                      <p>Take time to relax</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;