import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HiX, HiChatAlt2, HiLightBulb, HiCheck } from 'react-icons/hi';
import type { ReflectionEntry } from './types';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    reflection: ReflectionEntry | null;
    onToggleTodo?: (id: string, currentStatus: boolean) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, reflection, onToggleTodo }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');

    if (!reflection) return null;

    // Use stored messages if available, otherwise fallback to parsed content
    const messages =
        reflection.messages && reflection.messages.length > 0
            ? reflection.messages.map((msg) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
            }))
            : [
                {
                    id: 'user-msg',
                    role: 'user' as const,
                    content: reflection.content,
                    timestamp: new Date(reflection.timestamp),
                },
                ...(reflection.summary
                    ? [
                        {
                            id: 'ai-msg',
                            role: 'assistant' as const,
                            content: reflection.summary,
                            timestamp: new Date(reflection.timestamp),
                        },
                    ]
                    : []),
            ];

    return (
        <AnimatePresence>
            {isOpen && reflection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden h-[75vh] flex flex-col border border-white/50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">
                                    {reflection.type === 'morning' ? 'Morning' : 'Evening'}{' '}
                                    Reflection
                                </h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    {new Date(reflection.timestamp).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <HiX size={20} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 pt-6 pb-4 bg-white flex justify-center">
                            <div className="inline-flex bg-slate-100 rounded-full p-1 gap-1">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'chat'
                                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <HiChatAlt2 size={18} />
                                    Chat
                                </button>
                                <button
                                    onClick={() => setActiveTab('insights')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'insights'
                                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <HiLightBulb size={18} />
                                    Insights
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {activeTab === 'chat' ? (
                                /* Chat Tab */
                                <div className="p-6 space-y-6">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                            >
                                                <span className="text-xs text-slate-400 mb-2 px-2 font-bold uppercase tracking-wider">
                                                    {msg.role === 'assistant' ? 'Reflectly' : 'You'}
                                                </span>
                                                <div
                                                    className={`rounded-[2rem] px-8 py-6 text-sm lg:text-base leading-relaxed break-words shadow-sm ${msg.role === 'user'
                                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none'
                                                        : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200'
                                                        }`}
                                                >
                                                    <div className="prose prose-sm max-w-none">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                p: ({ ...props }) => (
                                                                    <p
                                                                        className={`mb-3 last:mb-0 ${msg.role === 'user' ? 'text-indigo-50' : 'text-slate-600'}`}
                                                                        {...props}
                                                                    />
                                                                ),
                                                                strong: ({ ...props }) => (
                                                                    <strong
                                                                        className={
                                                                            msg.role === 'user'
                                                                                ? 'text-white'
                                                                                : 'text-indigo-600'
                                                                        }
                                                                        {...props}
                                                                    />
                                                                ),
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Insights Tab */
                                <div className="p-10 space-y-12">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        <div className="lg:col-span-2 space-y-12">
                                            {/* Your Entry */}
                                            <section>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                                                    <span className="w-8 h-[2px] bg-indigo-500 rounded-full" />{' '}
                                                    Your Entry
                                                </h4>
                                                <div className="relative">
                                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />
                                                    <p className="text-lg text-slate-700 leading-relaxed font-medium pl-6 italic">
                                                        "{reflection.content}"
                                                    </p>
                                                </div>
                                            </section>

                                            {/* AI Summary */}
                                            {reflection.summary && (
                                                <section>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-purple-500 mb-6 flex items-center gap-2">
                                                        <span className="w-8 h-[2px] bg-purple-500 rounded-full" />{' '}
                                                        {reflection.title || 'AI Summary'}
                                                    </h4>
                                                    <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed bg-slate-50/50 p-8 rounded-3xl border border-slate-100/50">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {reflection.summary}
                                                        </ReactMarkdown>
                                                    </div>
                                                </section>
                                            )}
                                        </div>

                                        <div className="space-y-10">
                                            {/* Action Items */}
                                            {reflection.suggestedTodos &&
                                                reflection.suggestedTodos.length > 0 && (
                                                    <section className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
                                                            <HiCheck /> Your Goals
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {reflection.suggestedTodos.map(
                                                                (todo) => (
                                                                    <div
                                                                        key={todo.id}
                                                                        className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group/todo hover:border-emerald-200 transition-colors"
                                                                    >
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onToggleTodo?.(
                                                                                    todo.id,
                                                                                    todo.isCompleted,
                                                                                );
                                                                            }}
                                                                            className={`mt-1 shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${todo.isCompleted
                                                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                                : 'bg-white border-slate-200 hover:border-emerald-400'
                                                                                }`}
                                                                        >
                                                                            {todo.isCompleted && (
                                                                                <HiCheck
                                                                                    size={14}
                                                                                />
                                                                            )}
                                                                        </button>
                                                                        <div>
                                                                            <p
                                                                                className={`text-sm font-bold transition-all ${todo.isCompleted
                                                                                    ? 'text-slate-400 line-through'
                                                                                    : 'text-slate-700'
                                                                                    }`}
                                                                            >
                                                                                {todo.title}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </section>
                                                )}

                                            {/* Key Themes */}
                                            {reflection.keywords &&
                                                reflection.keywords.length > 0 && (
                                                    <section>
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-sky-500 mb-6 flex items-center gap-2">
                                                            <HiLightBulb /> Key Themes
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {reflection.keywords.map((kw, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-4 py-2 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm"
                                                                >
                                                                    {kw}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ChatModal;
