import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSun, HiMoon, HiCheck, HiPaperAirplane, HiSparkles, HiChatAlt2, HiPlus } from 'react-icons/hi';


// Define types
interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  analysisData?: AnalysisResult;
}

interface SuggestedTodo {
  id: string;
  title: string;
  completed: boolean;
  description: string;
  priority: 'low' | 'medium' | 'high';
  sourceReflectionId?: string;
}

interface AnalysisResult {
  summary: string;
  keywords?: string[];
  suggestedTodos?: SuggestedTodo[];
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

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
    if (!userInput || isSubmitting) return;

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
      const analysis = response.data.data.analysis;
      const feedback: string = analysis?.feedback || 'I received a response, but it seems to be empty.';

      addMessage('bot', feedback, {
        keywords: analysis?.keywords,
        summary: analysis?.summary,
        suggestedTodos: analysis?.suggestedTodos?.map((todo: SuggestedTodo) => ({
          id: todo.id || `todo-${Math.random().toString(36).substr(2, 9)}`,
          title: todo.title || (todo as unknown as { text?: string }).text || String(todo),
          completed: todo.completed || false,
          description: todo.description || '',
          priority: todo.priority || 'medium',
          sourceReflectionId: todo.sourceReflectionId
        })) || [],
      });
    } catch (error) {
      addMessage('bot', 'Sorry, I encountered an error while processing your reflection. Please try again.');
      console.error('Error submitting reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    const lastBotMessage = [...messages].reverse().find(msg => msg.sender === 'bot' && msg.analysisData);

    if (lastBotMessage?.analysisData) {
      setAnalysisResult(lastBotMessage.analysisData);
      setIsCompleted(true);
    } else {
      setSaveStatus({
        success: false,
        message: 'Please interact more before completing the reflection.'
      });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleNewChat = () => {
    setIsCompleted(false);
    setMessages([]);
    setAnalysisResult(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 flex overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
              <HiSparkles size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">E-Bot</h1>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setReflectionType('morning')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${reflectionType === 'morning'
                ? 'bg-sky-50 text-sky-600 font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <HiSun size={20} className={reflectionType === 'morning' ? 'text-sky-500' : ''} />
              Morning Reflection
            </button>
            <button
              onClick={() => setReflectionType('evening')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${reflectionType === 'evening'
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <HiMoon size={20} className={reflectionType === 'evening' ? 'text-indigo-500' : ''} />
              Evening Reflection
            </button>
          </nav>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {isCompleted && analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywords?.map((keyword, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm">
                      {keyword}
                    </span>
                  )) || <span className="text-sm text-slate-400 italic">No keywords detected yet</span>}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Summary</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {analysisResult.summary}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 mt-auto">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <HiPlus size={18} />
            New Reflection
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col h-full bg-white relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <HiSparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                {reflectionType === 'morning' ? 'Morning Journal' : 'Evening Review'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>AI Assistant Active</span>
              </div>
            </div>
          </div>

          {!isCompleted && messages.length > 0 && (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-full font-semibold text-sm hover:bg-sky-700 transition-all shadow-md shadow-sky-100 active:scale-95 disabled:opacity-50"
            >
              <HiCheck size={18} />
              Finish Reflection
            </button>
          )}
        </header>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 mb-4">
                    <HiChatAlt2 size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Ready for your {reflectionType} reflection?</h2>
                  <p className="text-slate-500 max-w-sm">
                    {reflectionType === 'morning'
                      ? "Start your day with intention. What are you grateful for and what do you hope to achieve today?"
                      : "Unwind and reflect on your day. What went well and what did you learn today?"}
                  </p>
                </motion.div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] lg:max-w-[75%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-5 py-3.5 text-sm lg:text-base leading-relaxed break-words shadow-sm ${msg.sender === 'user'
                          ? 'bg-sky-600 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                          }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                              ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                              h1: ({ ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
                              h2: ({ ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                              h3: ({ ...props }) => <h3 className="text-md font-bold my-1" {...props} />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        {/* Input area */}
        <div className="fixed lg:absolute bottom-0 left-0 lg:left-0 right-0 p-6 bg-gradient-to-t from-white via-white/100 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            {saveStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 p-3 rounded-xl text-center text-sm font-medium shadow-lg backdrop-blur-md ${saveStatus.success ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
                  }`}
              >
                {saveStatus.message}
              </motion.div>
            )}

            <form
              onSubmit={handleSubmit}
              className="relative group flex items-center gap-2"
            >
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isCompleted
                      ? "Reflection finished. Start new to continue."
                      : reflectionType === 'morning'
                        ? "What's on your mind this morning?"
                        : "How was your day?"
                  }
                  disabled={isSubmitting || isCompleted}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-14 py-4 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all resize-none shadow-xl shadow-slate-200/50 text-slate-700"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || isCompleted || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center hover:bg-sky-700 transition-all disabled:opacity-40 disabled:hover:bg-sky-600 shadow-md shadow-sky-200 active:scale-90"
                >
                  <HiPaperAirplane className="rotate-90" size={18} />
                </button>
              </div>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">
              Your Daily AI Companion
            </p>
          </div>
        </div>
      </main>

      {/* Completion Sidebar for mobile/tablet */}
      <AnimatePresence>
        {isCompleted && analysisResult && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 lg:hidden bg-white z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Reflection Summary</h2>
              <button
                onClick={() => setIsCompleted(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <HiPlus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-3 text-center py-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                  <HiCheck size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Well Done!</h3>
                <p className="text-slate-500">You've successfully completed your {reflectionType} reflection.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Analysis Highlights</h4>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-inner">
                  <p className="text-slate-700 leading-relaxed italic">
                    "{analysisResult.summary}"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywords?.map((keyword, i) => (
                    <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {analysisResult.suggestedTodos && analysisResult.suggestedTodos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Items</h4>
                  <div className="space-y-3">
                    {analysisResult.suggestedTodos.map((todo) => (
                      <div key={todo.id} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${todo.priority === 'high' ? 'bg-rose-500' : todo.priority === 'medium' ? 'bg-amber-500' : 'bg-sky-500'
                          }`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{todo.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{todo.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={handleNewChat}
                className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-200 active:scale-[0.98] transition-all"
              >
                Start New Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;