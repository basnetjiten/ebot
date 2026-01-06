import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSun, HiMoon, HiArrowLeft, HiCalendar, HiTag, HiOutlineDocumentText, HiSparkles, HiCheck, HiTrash } from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReflectionEntry } from './types';

interface DashboardPageProps {
    history: ReflectionEntry[];
    onToggleTodo: (id: string, currentStatus: boolean) => void;
    onDeleteReflection: (id: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ history, onToggleTodo, onDeleteReflection }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const selectedReflection = history.find(r => r.id === selectedId) || null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Your Reflection Journey</h1>
                <p className="text-slate-500 mt-2">Explore your past insights and daily growth.</p>
            </header>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
                {history.map((reflection) => (
                    <motion.div
                        key={reflection.id}
                        variants={item}
                        onClick={() => setSelectedId(reflection.id)}
                        className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${reflection.type === 'morning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />

                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl ${reflection.type === 'morning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {reflection.type === 'morning' ? <HiSun size={20} /> : <HiMoon size={20} />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <HiCalendar />
                                    {new Date(reflection.timestamp).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteConfirmId(reflection.id);
                                    }}
                                    className="relative z-10 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="Delete reflection"
                                >
                                    <HiTrash size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors capitalize">
                            {reflection.type} Reflection
                        </h3>

                        <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                            {reflection.content}
                        </p>

                        {reflection.keywords && reflection.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                                {reflection.keywords.slice(0, 3).map((kw, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <HiOutlineDocumentText size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">No reflections yet</h2>
                    <p className="text-slate-500 max-w-sm mt-2">Start your journey by completing your first daily entry!</p>
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
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 shadow-2xl z-50 max-w-md w-full mx-4"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                                    <HiTrash size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Delete Reflection?</h3>
                            </div>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                This will permanently delete this reflection and all associated action items. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
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
                                    className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors"
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
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-8 pb-0 flex items-center justify-between">
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                                >
                                    <HiArrowLeft size={24} />
                                </button>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] ${selectedReflection.type === 'morning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                    }`}>
                                    {selectedReflection.type}
                                </div>
                            </div>

                            <div className="p-10 overflow-y-auto">
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                                    <HiCalendar />
                                    {new Date(selectedReflection.timestamp).toLocaleDateString([], {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 mb-8">Detailed Insights</h2>

                                <div className="space-y-10">
                                    <section>
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-4 flex items-center gap-2">
                                            <HiOutlineDocumentText /> Your Entry
                                        </h4>
                                        <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                                            "{selectedReflection.content}"
                                        </p>
                                    </section>

                                    {selectedReflection.summary && (
                                        <section>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-4 flex items-center gap-2">
                                                <HiSparkles /> AI Summary
                                            </h4>
                                            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {selectedReflection.summary}
                                                </ReactMarkdown>
                                            </div>
                                        </section>
                                    )}

                                    {selectedReflection.suggestedTodos && selectedReflection.suggestedTodos.length > 0 && (
                                        <section>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-4 flex items-center gap-2">
                                                <HiCheck /> Daily Intentions
                                            </h4>
                                            <div className="space-y-3">
                                                {selectedReflection.suggestedTodos.map((todo) => (
                                                    <div key={todo.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group/todo">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleTodo(todo.id, todo.isCompleted);
                                                            }}
                                                            className={`mt-1 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${todo.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 hover:border-emerald-400'
                                                                }`}
                                                        >
                                                            {todo.isCompleted && <HiCheck size={14} />}
                                                        </button>
                                                        <div>
                                                            <p className={`text-sm font-semibold transition-all ${todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                                {todo.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                                {todo.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {selectedReflection.keywords && selectedReflection.keywords.length > 0 && (
                                        <section>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-4 flex items-center gap-2">
                                                <HiTag /> Key Themes
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedReflection.keywords.map((kw, i) => (
                                                    <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 shadow-sm">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    )}
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
