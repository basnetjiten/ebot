import React from 'react';
import { motion } from 'framer-motion';
import { HiSun, HiSparkles, HiPlus, HiCheck, HiDesktopComputer } from 'react-icons/hi';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AnalysisResult, ReflectionEntry, UserKeyword } from './types';

interface SidebarProps {
    userId: string | null;
    onNewChat: () => void;
    onLogout: () => void;
    history: ReflectionEntry[];
    userKeywords: UserKeyword[];
    analysisResult: AnalysisResult | null;
    onToggleTodo?: (id: string, currentStatus: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    userId,
    onNewChat,
    onLogout,
    history,
    userKeywords,
    analysisResult,
    onToggleTodo
}) => {
    const location = useLocation();

    return (
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex h-screen sticky top-0">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-100 rotate-3">
                        <HiSparkles size={24} />
                    </div>
                    <h1 className="font-black text-2xl text-slate-800 tracking-tight">E-Bot</h1>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sky-600 mt-2 ml-1">AI Reflection Companion</p>
            </div>

            <div className="p-6">
                <nav className="space-y-1">
                    <Link
                        to="/"
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/'
                            ? 'bg-sky-50 text-sky-600 font-semibold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                    >
                        <HiSun size={20} className={location.pathname === '/' ? 'text-sky-500' : ''} />
                        Reflection Chat
                    </Link>
                    <Link
                        to="/dashboard"
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/dashboard'
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                    >
                        <HiDesktopComputer size={20} className={location.pathname === '/dashboard' ? 'text-indigo-500' : ''} />
                        Dashboard
                    </Link>
                </nav>
            </div>

            {/* Analytics Summary */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-8">
                {/* Contextual/Current Analysis */}
                {analysisResult && location.pathname !== '/dashboard' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {analysisResult.keywords?.map((keyword, i) => (
                                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm">
                                        {keyword}
                                    </span>
                                )) || <span className="text-sm text-slate-400 italic">No topics detected</span>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Summary</h3>
                            <div className="prose prose-sm max-w-none text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {analysisResult.summary}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {analysisResult.suggestedTodos && analysisResult.suggestedTodos.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Items</h3>
                                <div className="space-y-2">
                                    {analysisResult.suggestedTodos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className={`group flex items-center gap-3 p-3 bg-white border rounded-xl shadow-sm transition-all ${todo.isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 hover:border-sky-100'
                                                }`}
                                        >
                                            <button
                                                onClick={() => onToggleTodo?.(todo.id, todo.isCompleted)}
                                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${todo.isCompleted
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-slate-300 group-hover:border-sky-400'
                                                    }`}
                                            >
                                                {todo.isCompleted && <HiCheck size={14} />}
                                            </button>
                                            <div className="flex-1">
                                                <p className={`text-xs font-semibold transition-all ${todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                                                    }`}>
                                                    {todo.title}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Global/Recent Keywords */}
                {userKeywords.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Popular Topics</h3>
                        <div className="flex flex-wrap gap-2">
                            {userKeywords.slice(0, 5).map((kw, i) => (
                                <div key={i} className="px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-full text-xs text-sky-700 font-medium flex items-center gap-1.5">
                                    {kw.keyword}
                                    <span className="bg-sky-200/50 px-1 rounded text-[10px]">{kw.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* History List */}
                {history.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Activity</h3>
                            <Link to="/dashboard" className="text-[10px] font-bold text-sky-600 hover:underline uppercase tracking-tight">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {history.slice(0, 3).map((item) => (
                                <div
                                    key={item.id}
                                    className="group p-3 rounded-xl border border-slate-100 hover:border-sky-100 hover:bg-sky-50/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${item.type === 'morning' ? 'text-amber-500' : 'text-indigo-500'}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-1 group-hover:text-slate-900 transition-colors">
                                        {item.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 mt-auto space-y-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Logged in as</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{userId}</p>
                </div>
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <HiPlus size={18} />
                    New Reflection
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-medium hover:bg-rose-100 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
