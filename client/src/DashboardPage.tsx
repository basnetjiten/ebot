import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiSun,
    HiMoon,
    HiArrowLeft,
    HiCalendar,
    HiTag,
    HiOutlineDocumentText,
    HiCheck,
    HiTrash,
} from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReflectionEntry } from './types';

interface DashboardPageProps {
    history: ReflectionEntry[];
    onToggleTodo: (id: string, currentStatus: boolean) => void;
    onDeleteReflection: (id: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
    history,
    onToggleTodo,
    onDeleteReflection,
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const selectedReflection = history.find((r) => r.id === selectedId) || null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-rose-50/20 min-h-screen p-8 overflow-y-auto relative">
            {/* Background decoration */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl -z-10" />

            <header className="mb-12 relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-white rounded-2xl shadow-sm shadow-indigo-100">
                        <HiTag className="text-indigo-500" size={24} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                            Your Journey
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Explore your past insights and daily growth.
                        </p>
                    </div>
                </div>
            </header>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20"
            >
                {history.map((reflection) => (
                    <motion.div
                        key={reflection.id}
                        variants={item}
                        onClick={() => setSelectedId(reflection.id)}
                        className="group bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden ring-1 ring-slate-100/50"
                    >
                        {/* Decorative Gradient Blob */}
                        <div
                            className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${reflection.type === 'morning' ? 'bg-amber-400' : 'bg-indigo-600'}`}
                        />

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div
                                className={`p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${reflection.type === 'morning'
                                    ? 'bg-amber-50 text-amber-500 ring-1 ring-amber-100'
                                    : 'bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100'
                                    }`}
                            >
                                {reflection.type === 'morning' ? (
                                    <HiSun size={24} />
                                ) : (
                                    <HiMoon size={24} />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-white/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm border border-slate-100">
                                    {new Date(reflection.timestamp).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteConfirmId(reflection.id);
                                    }}
                                    className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                    aria-label="Delete reflection"
                                >
                                    <HiTrash size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors capitalize tracking-tight flex items-center gap-2">
                            {reflection.type == 'morning'
                                ? 'Morning Intention'
                                : 'Evening Reflection'}
                            <HiArrowLeft
                                className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-indigo-400 rotate-180"
                                size={16}
                            />
                        </h3>

                        <p className="text-slate-600 text-sm line-clamp-3 mb-6 leading-relaxed font-medium">
                            {reflection.content}
                        </p>

                        {reflection.keywords && reflection.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100/50 relative z-10">
                                {reflection.keywords.slice(0, 3).map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-slate-500 text-[10px] font-bold uppercase tracking-wider shadow-sm group-hover:border-indigo-100 transition-colors"
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40 text-center relative z-10">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-indigo-300 mb-6 shadow-xl shadow-indigo-100 border border-indigo-50 rotate-3 animate-pulse">
                        <HiOutlineDocumentText size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">No reflections yet</h2>
                    <p className="text-slate-500 max-w-sm mt-2 text-lg">
                        Start your journey by completing your first daily entry!
                    </p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmId(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] p-10 shadow-2xl z-50 max-w-md w-full mx-4 border border-slate-100"
                        >
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 shadow-lg shadow-rose-100">
                                    <HiTrash size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">
                                    Delete Reflection?
                                </h3>
                                <p className="text-slate-500 leading-relaxed max-w-xs">
                                    This will permanently delete this reflection and all associated
                                    action items.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onDeleteReflection(deleteConfirmId);
                                        setDeleteConfirmId(null);
                                        if (selectedId === deleteConfirmId) {
                                            setSelectedId(null);
                                        }
                                    }}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-rose-500/30 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedReflection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/50"
                        >
                            {/* Modal Header */}
                            <div className="p-8 pb-0 flex items-center justify-between relative z-10">
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
                                >
                                    <HiArrowLeft size={24} />
                                </button>
                                <div
                                    className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm ${selectedReflection.type === 'morning'
                                        ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                                        : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'
                                        }`}
                                >
                                    {selectedReflection.type} Mode
                                </div>
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-2.5 text-slate-400 text-sm font-bold uppercase tracking-wide mb-8">
                                    <HiCalendar className="text-slate-300" size={18} />
                                    {new Date(selectedReflection.timestamp).toLocaleDateString([], {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </div>

                                <h2 className="text-4xl font-black text-slate-800 mb-12 tracking-tight">
                                    Detailed Insights
                                </h2>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-12">
                                        <section>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                                                <span className="w-8 h-[2px] bg-indigo-500 rounded-full" />{' '}
                                                Your Entry
                                            </h4>
                                            <div className="relative">
                                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />
                                                <p className="text-lg text-slate-700 leading-relaxed font-medium pl-6 italic">
                                                    "{selectedReflection.content}"
                                                </p>
                                            </div>
                                        </section>

                                        {selectedReflection.summary && (
                                            <section>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-purple-500 mb-6 flex items-center gap-2">
                                                    <span className="w-8 h-[2px] bg-purple-500 rounded-full" />{' '}
                                                    AI Summary
                                                </h4>
                                                <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed bg-slate-50/50 p-8 rounded-3xl border border-slate-100/50">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {selectedReflection.summary}
                                                    </ReactMarkdown>
                                                </div>
                                            </section>
                                        )}
                                    </div>

                                    <div className="space-y-10">
                                        {selectedReflection.suggestedTodos &&
                                            selectedReflection.suggestedTodos.length > 0 && (
                                                <section className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
                                                        <HiCheck /> Your Goals
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {selectedReflection.suggestedTodos.map(
                                                            (todo) => (
                                                                <div
                                                                    key={todo.id}
                                                                    className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group/todo hover:border-emerald-200 transition-colors"
                                                                >
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onToggleTodo(
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
                                                                            <HiCheck size={14} />
                                                                        )}
                                                                    </button>
                                                                    <div>
                                                                        <p
                                                                            className={`text-sm font-bold transition-all ${todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}
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

                                        {selectedReflection.keywords &&
                                            selectedReflection.keywords.length > 0 && (
                                                <section>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-sky-500 mb-6 flex items-center gap-2">
                                                        <HiTag /> Key Themes
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedReflection.keywords.map(
                                                            (kw, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-4 py-2 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm"
                                                                >
                                                                    {kw}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </section>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardPage;
