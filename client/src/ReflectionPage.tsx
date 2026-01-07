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
                code: ({ ...props }) => <code className="bg-slate-200 px-1 rounded" {...props} />,
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
    onToggleTodo: _onToggleTodo,
}) => {
    return (
        <div className="flex-1 flex flex-col h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Gradient Blob */}
            <div
                className={`fixed top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 -z-10`}
            />

            {/* Header */}
            <header className="h-24 flex items-center justify-between px-8 bg-white/80 backdrop-blur-xl sticky top-0 z-20 shrink-0 border-b border-white/20 shadow-sm shadow-indigo-500/5">
                <div className="flex items-center gap-5">
                    <div className="lg:hidden w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <HiSparkles size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                            {reflectionType === 'morning' ? 'Morning Journal' : 'Evening Review'}
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-indigo-400">AI Active</span>
                        </div>
                    </div>
                </div>

                {!isCompleted && messages.length > 0 && (
                    <button
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="group flex items-center gap-3 px-8 py-3.5 bg-slate-800 text-white rounded-full font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                            <HiCheck size={14} />
                        </div>
                        Finish Session
                    </button>
                )}
            </header>

            {/* Todo Completion Warning */}
            {todoStatus && todoStatus.uncompleted > todoStatus.completed && (
                <div className="bg-amber-50/50 backdrop-blur-sm border-b border-amber-100/50 px-8 py-4 flex items-center gap-4 text-amber-800 text-sm font-bold shrink-0 shadow-sm sticky top-24 z-10">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />
                    <p>
                        You have uncompleted action items from your last reflection. Let's aim to
                        clear them!
                    </p>
                </div>
            )}

            {/* Chat window */}
            <div className="flex-1 overflow-y-auto px-4 py-8 pb-48 lg:px-12 custom-scrollbar scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-10">
                    <AnimatePresence initial={false}>
                        {messages.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-10 text-center space-y-8"
                            >
                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-indigo-500 mb-2 shadow-xl shadow-indigo-100 border border-indigo-50 rotate-3 transform hover:rotate-6 transition-transform duration-500">
                                    <HiChatAlt2 size={48} />
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                                        Ready for your{' '}
                                        <span
                                            className={
                                                reflectionType === 'morning'
                                                    ? 'text-amber-500'
                                                    : 'text-indigo-500'
                                            }
                                        >
                                            {reflectionType}
                                        </span>{' '}
                                        {reflectionType === 'morning'
                                            ? 'intention?'
                                            : 'reflection?'}
                                    </h2>
                                    <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
                                        Select a mode below to customize your session.
                                    </p>
                                </div>

                                <div className="flex gap-6 mt-8 w-full max-w-lg justify-center">
                                    <button
                                        onClick={() => setReflectionType('morning')}
                                        className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-[2rem] transition-all duration-300 group ${
                                            reflectionType === 'morning'
                                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-2xl shadow-amber-500/30 scale-105'
                                                : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-amber-200 hover:bg-amber-50 grayscale hover:grayscale-0'
                                        }`}
                                    >
                                        <div
                                            className={`p-4 rounded-2xl ${reflectionType === 'morning' ? 'bg-white/20' : 'bg-slate-50'}`}
                                        >
                                            <HiSun
                                                size={32}
                                                className={
                                                    reflectionType === 'morning'
                                                        ? 'text-white'
                                                        : 'text-slate-400 group-hover:text-amber-500'
                                                }
                                            />
                                        </div>
                                        <span className="font-black text-lg">Morning</span>
                                    </button>
                                    <button
                                        onClick={() => setReflectionType('evening')}
                                        className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-[2rem] transition-all duration-300 group ${
                                            reflectionType === 'evening'
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/30 scale-105'
                                                : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 grayscale hover:grayscale-0'
                                        }`}
                                    >
                                        <div
                                            className={`p-4 rounded-2xl ${reflectionType === 'evening' ? 'bg-white/20' : 'bg-slate-50'}`}
                                        >
                                            <HiMoon
                                                size={32}
                                                className={
                                                    reflectionType === 'evening'
                                                        ? 'text-white'
                                                        : 'text-slate-400 group-hover:text-indigo-500'
                                                }
                                            />
                                        </div>
                                        <span className="font-black text-lg">Evening</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 w-full max-w-3xl">
                                    {(reflectionType === 'morning'
                                        ? [
                                              {
                                                  title: 'Focus & Energy',
                                                  desc: 'Identify your top priority for today',
                                              },
                                              {
                                                  title: 'Obstacle Planning',
                                                  desc: 'Prepare for potential challenges',
                                              },
                                              {
                                                  title: 'Gratitude Start',
                                                  desc: 'Begin with three positive things',
                                              },
                                          ]
                                        : [
                                              {
                                                  title: 'Daily Wins',
                                                  desc: 'Log what went well today',
                                              },
                                              {
                                                  title: 'Lessons Learned',
                                                  desc: 'Capture insights from mistakes',
                                              },
                                              {
                                                  title: 'Mental Reset',
                                                  desc: 'Clear your mind for rest',
                                              },
                                          ]
                                    ).map((tip, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(tip.title + ': ')}
                                            className="p-5 bg-white border border-slate-100 rounded-3xl text-left hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-bl-full opacity-50 group-hover:scale-150 transition-transform origin-top-right duration-500" />
                                            <h4 className="text-sm font-black text-slate-700 group-hover:text-indigo-600 mb-1 relative z-10">
                                                {tip.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 group-hover:text-slate-500 relative z-10 font-bold">
                                                {tip.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] lg:max-w-[75%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`rounded-[2rem] px-8 py-6 text-sm lg:text-base leading-relaxed break-words shadow-sm relative ${
                                                msg.sender === 'user'
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none shadow-indigo-500/20'
                                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-slate-200/50'
                                            }`}
                                        >
                                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                                                {msg.sender === 'bot' &&
                                                msg === messages[messages.length - 1] &&
                                                !isCompleted ? (
                                                    <Typewriter text={msg.content} speed={10} />
                                                ) : (
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ ...props }) => (
                                                                <p
                                                                    className={`mb-3 last:mb-0 ${msg.sender === 'user' ? 'text-indigo-50' : 'text-slate-600'}`}
                                                                    {...props}
                                                                />
                                                            ),
                                                            ul: ({ ...props }) => (
                                                                <ul
                                                                    className="list-disc ml-4 mb-2 opacity-90"
                                                                    {...props}
                                                                />
                                                            ),
                                                            ol: ({ ...props }) => (
                                                                <ol
                                                                    className="list-decimal ml-4 mb-2 opacity-90"
                                                                    {...props}
                                                                />
                                                            ),
                                                            h1: ({ ...props }) => (
                                                                <h1
                                                                    className="text-xl font-bold my-2"
                                                                    {...props}
                                                                />
                                                            ),
                                                            strong: ({ ...props }) => (
                                                                <strong
                                                                    className={
                                                                        msg.sender === 'user'
                                                                            ? 'text-white'
                                                                            : 'text-indigo-600'
                                                                    }
                                                                    {...props}
                                                                />
                                                            ),
                                                            code: ({ ...props }) => (
                                                                <code
                                                                    className={`${msg.sender === 'user' ? 'bg-indigo-700/50' : 'bg-slate-100'} px-1.5 py-0.5 rounded font-medium`}
                                                                    {...props}
                                                                />
                                                            ),
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                )}
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2 px-2 flex items-center gap-1">
                                            {msg.sender === 'bot' && (
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                            )}
                                            {msg.sender === 'bot' ? 'Reflectly' : 'You'} •{' '}
                                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
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
                                    <div className="bg-white text-slate-400 rounded-[2rem] px-6 py-4 rounded-tl-none border border-slate-100 flex items-center gap-2 shadow-sm">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                                        <span className="text-xs font-bold ml-2 uppercase tracking-widest text-slate-300">
                                            Thinking...
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input section */}
            {!isCompleted && (
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 bg-gradient-to-t from-white via-white/95 to-transparent z-10">
                    <div className="max-w-4xl mx-auto relative group">
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={
                                    messages.length === 0
                                        ? `Good ${reflectionType === 'morning' ? 'morning' : 'evening'}! What's on your mind?`
                                        : 'Continue your reflection...'
                                }
                                disabled={isSubmitting}
                                className="w-full bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2.5rem] px-8 py-6 pr-20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 shadow-2xl shadow-indigo-500/10 resize-none min-h-[96px] max-h-[240px]"
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
                                className="absolute right-3 bottom-3 w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:grayscale group-hover:scale-105"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <HiPaperAirplane className="rotate-90 w-6 h-6 ml-0.5" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isCompleted && (
                <div className="absolute bottom-10 left-0 right-0 px-6 z-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-emerald-100 p-6 rounded-[2rem] flex items-center justify-center gap-4 text-emerald-800 font-black shadow-2xl shadow-emerald-500/20"
                    >
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/40">
                            <HiCheck size={24} />
                        </div>
                        Daily Reflection Completed
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ReflectionPage;
