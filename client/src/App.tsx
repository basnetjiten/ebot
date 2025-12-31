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
  analysisData?: AnalysisResult;
}

// Type for the detailed analysis shown in the summary view
interface AnalysisResult {
  summary: string;
  moods?: string[];
  goals?: string[];
}

interface ReflectionPayload {
  userId: string;
  type: 'morning' | 'evening';
  content: string;
}



function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reflectionType, setReflectionType] = useState<'morning' | 'evening'>('morning');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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

  const addMessage = (sender: 'user' | 'bot', content: string, analysisData?: AnalysisResult) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      content,
      timestamp: new Date(),
      analysisData
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
      // Extract the analysis data from the response
      const analysis = response.data.data.analysis;

      // The feedback is nested under analysis.feedback
      const feedback: string = analysis?.feedback || 'I received a response, but it seems to be empty.';

      // Add the bot's message with the analysis data
      addMessage('bot', feedback, {
        moods: analysis?.mood?.emotions,
        summary: analysis?.summary,
        goals: analysis?.goals,

      });
    } catch (error) {
      addMessage('bot', 'Sorry, I encountered an error. Please try again.');
      console.error('Error submitting reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSaveStatus(null);
    console.log("About to process completion");

    try {
      // Find the latest bot response that contains analysis data
      const lastBotMessage = [...messages].reverse().find(msg =>
        msg.sender === 'bot' &&
        msg.analysisData // Check if analysis data exists
      );

      console.log('Found last bot message:', lastBotMessage);
      if (!lastBotMessage?.analysisData) {
        throw new Error('No analysis data found in bot messages');
      }

      const { moods, summary, goals } = lastBotMessage.analysisData;

      const newAnalysis: AnalysisResult = {
        summary: summary || 'No summary available.',
        moods: moods || [],
        goals: goals || [],

      };



      setAnalysisResult(newAnalysis);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error finishing reflection:', error);
      setSaveStatus({
        success: false,
        message: 'Failed to get the final analysis. Please try again.'
      });
    }
  };


  const handleNewChat = () => {
    setIsCompleted(false);
    setMessages([]);
    setAnalysisResult(null);
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
      <div className="chat-container with-sidebar">
        {/* Sidebar Toggle */}
        <div className="sidebar-toggle">
          <div className="type-selector">
            <span
              className={`type-option ${reflectionType === 'morning' ? 'active' : ''}`}
              onClick={() => setReflectionType('morning')}
            >
              ☀️ Morning
            </span>
            <span
              className={`type-option ${reflectionType === 'evening' ? 'active' : ''}`}
              onClick={() => setReflectionType('evening')}
            >
              🌙 Evening
            </span>
          </div>

          {!isCompleted && messages.length > 0 && (
            <div className="complete-button-container">
              <button
                onClick={handleComplete}
                className="complete-button"
                disabled={isSubmitting}
              >
                <CheckIcon /> Complete Reflection
              </button>
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
                  <div className="chat-buttons">
                    <button
                      type="submit"
                      className="send-button"
                      disabled={isSubmitting || !input.trim()}
                      aria-label="Send message"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="chat-interface">
              <div className="chat-header">
                <h2>{reflectionType === 'morning' ? '☀️ Morning Reflection' : '🌙 Evening Reflection'}</h2>
              </div>
              <div className="chat-window">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-container ${msg.sender}`}>
                    <div className={`message ${msg.sender}`}>
                      <div className="message-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="chat-input-container">
                <div className="input-wrapper">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Continue your reflection..."
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
                  <div className="chat-buttons">
                    <button
                      type="submit"
                      className="send-button"
                      disabled={isSubmitting || !input.trim()}
                      aria-label="Send message"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Reflection Results Sidebar */}
      <div className={`reflection-sidebar ${isCompleted ? 'visible' : ''}`}>
        {isCompleted && analysisResult && (
          <div className="summary-view">
            <div className="summary-card">
              <h2>Your {reflectionType === 'morning' ? 'Morning' : 'Evening'} Reflection</h2>

              <div className="mood-display">
                <h3>Your Moods</h3>
                <div className="mood-chips">
                  {analysisResult.moods && analysisResult.moods.length > 0 ? (
                    analysisResult.moods.map((mood: string, index: number) => (
                      <span key={index} className="mood-chip">
                        {mood}
                      </span>
                    ))
                  ) : (
                    <span className="mood-chip">Neutral</span>
                  )}
                </div>
              </div>

              <div className="summary-section">
                <h3>Summary</h3>
                <div className="summary-content">
                  {analysisResult.summary || 'No summary available.'}
                </div>
              </div>

              {analysisResult.goals && analysisResult.goals.length > 0 && (
                <div className="goals-section">
                  <h3>Your Goals</h3>
                  <ul className="goals-list">
                    {analysisResult.goals.map((goal: string, i: number) => (
                      <li key={i} className="goal-item">
                        <span className="goal-checkbox"></span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="completion-actions">
                <button onClick={handleNewChat} className="new-chat-button">
                  Start New Reflection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;