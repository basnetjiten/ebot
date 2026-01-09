import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiSun, HiMoon, HiChatAlt2, HiArrowLeft, HiOutlineDocumentText, HiTrash } from 'react-icons/hi';
import type { ReflectionEntry } from './types';
import ChatModal from './ChatModal';
import ConfirmationModal from './ConfirmationModal';

interface ChatHistoryPageProps {
    history: ReflectionEntry[];
    onToggleTodo?: (id: string, currentStatus: boolean) => void;
    onDeleteReflection: (id: string) => void;
}

const ChatHistoryPage: React.FC<ChatHistoryPageProps> = ({ history, onToggleTodo, onDeleteReflection }) => {
    const [selectedReflection, setSelectedReflection] = useState<ReflectionEntry | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reflectionToDelete, setReflectionToDelete] = useState<string | null>(null);

    const handleCardClick = (reflection: ReflectionEntry) => {
        setSelectedReflection(reflection);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedReflection(null), 300);
    };

    // Sync selectedReflection with history updates
    useEffect(() => {
        if (selectedReflection) {
            const updated = history.find((r) => r.id === selectedReflection.id);
            if (updated) {
                setSelectedReflection(updated);
            }
        }
    }, [history, selectedReflection]);

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
                        <HiChatAlt2 className="text-indigo-500" size={24} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                            Chat History
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Explore your past conversations and reflections.
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
                        layout
                        key={reflection.id}
                        variants={item}
                        onClick={() => handleCardClick(reflection)}
                        className="group bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden ring-1 ring-slate-100/50"
                    >

                        <div
                            className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${reflection.type === 'morning' ? 'bg-amber-400' : 'bg-indigo-600'
                                }`}
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
                            <span className="px-3 py-1 rounded-full bg-white/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm border border-slate-100">
                                {new Date(reflection.timestamp).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReflectionToDelete(reflection.id);
                                }}
                                className="p-2 rounded-full bg-white/80 text-rose-400 shadow-sm ml-2 border border-rose-100"
                                title="Delete Reflection"
                            >
                                <HiTrash size={16} />
                            </motion.button>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors capitalize tracking-tight flex items-center gap-2">
                            {reflection.type === 'morning'
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

            {/* Modal */}
            <ChatModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                reflection={selectedReflection}
                onToggleTodo={onToggleTodo}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!reflectionToDelete}
                onClose={() => setReflectionToDelete(null)}
                onConfirm={() => {
                    if (reflectionToDelete) {
                        onDeleteReflection(reflectionToDelete);
                    }
                }}
                title="Delete Reflection?"
                message="This action cannot be undone. Are you sure you want to permanently delete it?"
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
};

export default ChatHistoryPage;
