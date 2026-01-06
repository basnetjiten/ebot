import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HiSun, HiMoon, HiCheck, HiPaperAirplane, HiSparkles, HiChatAlt2 } from 'react-icons/hi';
import type { Message } from './types';

interface ReflectionPageProps {
    messages: Message[];
    input: string;
    setInput: (val: string) => void;
    isSubmitting: boolean;
    isCompleted: boolean;
    reflectionType: 'morning' | 'evening';
    setReflectionType: (type: 'morning' | 'evening') => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleComplete: () => void;
    todoStatus: { uncompleted: number; completed: number } | null;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    onToggleTodo?: (id: string, currentStatus: boolean) => void;
}

const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 15 }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    const [isComplete, setIsComplete] = React.useState(false);

    React.useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            setDisplayedText(text.substring(0, i));
            i++;
            if (i > text.length) {
                clearInterval(timer);
                setIsComplete(true);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                h1: ({ ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
                h2: ({ ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                h3: ({ ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                code: ({ ...props }) => <code className="bg-slate-200 px-1 rounded" {...props} />
            }}
        >
            {displayedText + (!isComplete ? ' ▎' : '')}
        </ReactMarkdown>
    );
};

const ReflectionPage: React.FC<ReflectionPageProps> = ({
    messages,
    input,
    setInput,
    isSubmitting,
    isCompleted,
    reflectionType,
    setReflectionType,
    handleSubmit,
    handleComplete,
    todoStatus,
    chatEndRef,
    onToggleTodo
}) => {
    return (
        <div className="flex-1 flex flex-col h-screen bg-white relative overflow-hidden">
            {/* Header */}
            <header className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
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

            {/* Todo Completion Warning */}
            {todoStatus && todoStatus.uncompleted > todoStatus.completed && (
                <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex items-center gap-3 text-amber-800 text-sm font-medium shrink-0">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <p>You have uncompleted action items from your last reflection</p>
                </div>
            )}

            {/* Chat window */}
            <div className="flex-1 overflow-y-auto px-4 py-8 pb-40 lg:px-12 custom-scrollbar">
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
                                <div className="flex gap-4 mt-6">
                                    <button
                                        onClick={() => setReflectionType('morning')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${reflectionType === 'morning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <HiSun size={20} /> Morning
                                    </button>
                                    <button
                                        onClick={() => setReflectionType('evening')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${reflectionType === 'evening' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <HiMoon size={20} /> Evening
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
                                    {(reflectionType === 'morning' ? [
                                        { title: 'Focus & Energy', desc: 'Identify your top priority for today' },
                                        { title: 'Obstacle Planning', desc: 'Prepare for potential challenges' },
                                        { title: 'Gratitude Start', desc: 'Begin with three positive things' }
                                    ] : [
                                        { title: 'Daily Wins', desc: 'Log what went well today' },
                                        { title: 'Lessons Learned', desc: 'Capture insights from mistakes' },
                                        { title: 'Mental Reset', desc: 'Clear your mind for rest' }
                                    ]).map((tip, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(tip.title + ': ')}
                                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-sky-300 hover:bg-sky-50 transition-all group"
                                        >
                                            <h4 className="text-sm font-bold text-slate-700 group-hover:text-sky-700 mb-1">{tip.title}</h4>
                                            <p className="text-[10px] text-slate-400 group-hover:text-sky-600">{tip.desc}</p>
                                        </button>
                                    ))}
                                </div>
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
                                                {msg.sender === 'bot' && msg === messages[messages.length - 1] && !isCompleted ? (
                                                    <Typewriter text={msg.content} />
                                                ) : (
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                            ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                            h1: ({ ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
                                                            h2: ({ ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                                                            h3: ({ ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                                                            code: ({ ...props }) => <code className="bg-slate-200 px-1 rounded" {...props} />
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                )}
                                            </div>
                                        </div>


                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                            {msg.sender === 'bot' ? 'E-Bot' : 'You'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                    <div ref={chatEndRef}>
                        {isSubmitting && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="flex justify-start"
                            >
                                <div className="max-w-[85%] lg:max-w-[75%] space-y-1 items-start flex flex-col">
                                    <div className="bg-slate-100 text-slate-400 rounded-2xl px-5 py-3.5 rounded-tl-none border border-slate-200 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                        <span className="text-xs font-bold ml-2 uppercase tracking-widest opacity-50">E-Bot is replying...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input section */}
            {!isCompleted && (
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 bg-gradient-to-t from-white via-white/95 to-transparent">
                    <div className="max-w-3xl mx-auto relative group">
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={messages.length === 0 ? `Good ${reflectionType === 'morning' ? 'morning' : 'evening'}! What's on your mind?` : "Continue your reflection..."}
                                disabled={isSubmitting}
                                className="w-full bg-white border-2 border-slate-100 rounded-[2rem] px-8 py-5 pr-16 focus:ring-8 focus:ring-sky-500/5 focus:border-sky-500 outline-none transition-all text-slate-700 shadow-xl shadow-slate-200/50 resize-none min-h-[80px] max-h-[200px]"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !input.trim()}
                                className="absolute right-3 bottom-3 w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center hover:bg-sky-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:bg-slate-400 group-hover:scale-110"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <HiPaperAirplane className="rotate-90" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isCompleted && (
                <div className="absolute bottom-10 left-0 right-0 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-center gap-3 text-emerald-700 font-bold shadow-sm"
                    >
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <HiCheck size={20} />
                        </div>
                        Daily Reflection Completed
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ReflectionPage;
