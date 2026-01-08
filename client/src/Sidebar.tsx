import React from 'react';
import { motion } from 'framer-motion';
import {
    HiSun,
    HiPlus,
    HiCheck,
    HiDesktopComputer,
    HiEmojiHappy,
    HiMail,
    HiSparkles,
} from 'react-icons/hi';
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
    onToggleTodo,
}) => {
    const location = useLocation();

    return (
        <aside className="w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col hidden lg:flex h-screen sticky top-0 relative z-20">
            <div className="p-8 border-b border-slate-100/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 rotate-3 transform hover:rotate-6 transition-transform">
                        <HiEmojiHappy size={24} />
                    </div>
                    <h1 className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
                        Reflectly
                    </h1>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-500 mt-2 ml-1">
                    AI Reflection Companion
                </p>
            </div>

            <div className="p-6">
                <nav className="space-y-2">
                    <Link
                        to="/reflection"
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                            location.pathname === '/reflection'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <HiSun
                            size={20}
                            className={
                                location.pathname === '/reflection'
                                    ? 'text-white/90'
                                    : 'group-hover:text-amber-500 transition-colors'
                            }
                        />
                        <span className="font-semibold tracking-wide">Recent Chat</span>
                    </Link>
                    <Link
                        to="/dashboard"
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                            location.pathname === '/dashboard'
                                ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow-md shadow-fuchsia-500/25'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <HiDesktopComputer
                            size={20}
                            className={
                                location.pathname === '/dashboard'
                                    ? 'text-white/90'
                                    : 'group-hover:text-fuchsia-500 transition-colors'
                            }
                        />
                        <span className="font-semibold tracking-wide">Dashboard</span>
                    </Link>
                    <Link
                        to="/tasks"
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                            location.pathname === '/tasks'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <HiCheck
                            size={20}
                            className={
                                location.pathname === '/tasks'
                                    ? 'text-white/90'
                                    : 'group-hover:text-emerald-500 transition-colors'
                            }
                        />
                        <span className="font-semibold tracking-wide">Tasks</span>
                    </Link>
                    <Link
                        to="/email"
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                            location.pathname === '/email'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <HiMail
                            size={20}
                            className={
                                location.pathname === '/email'
                                    ? 'text-white/90'
                                    : 'group-hover:text-blue-500 transition-colors'
                            }
                        />
                        <span className="font-semibold tracking-wide">Email Agent</span>
                    </Link>
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-8">
                {/* Contextual/Current Analysis */}
                {analysisResult && location.pathname !== '/dashboard' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-500"></span> Current
                                Topics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {analysisResult.keywords?.map((keyword, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-white border border-slate-200/60 rounded-full text-xs font-medium text-slate-600 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default"
                                    >
                                        {keyword}
                                    </span>
                                )) || (
                                    <span className="text-sm text-slate-400 italic">
                                        No topics detected
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-purple-500"></span> Current
                                Summary
                            </h3>
                            <div className="prose prose-sm max-w-none text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {analysisResult.summary}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {analysisResult.suggestedTodos &&
                            analysisResult.suggestedTodos.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>{' '}
                                        Action Items
                                    </h3>
                                    <div className="space-y-2">
                                        {analysisResult.suggestedTodos.map((todo) => (
                                            <div
                                                key={todo.id}
                                                className={`group flex items-center gap-3 p-3 bg-white/60 border rounded-2xl shadow-sm transition-all backdrop-blur-sm ${
                                                    todo.isCompleted
                                                        ? 'border-emerald-100 bg-emerald-50/30'
                                                        : 'border-slate-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5'
                                                }`}
                                            >
                                                <button
                                                    onClick={() =>
                                                        onToggleTodo?.(todo.id, todo.isCompleted)
                                                    }
                                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shadow-sm ${
                                                        todo.isCompleted
                                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                                            : 'bg-white border-slate-200 group-hover:border-indigo-400'
                                                    }`}
                                                >
                                                    {todo.isCompleted && <HiCheck size={14} />}
                                                </button>
                                                <div className="flex-1">
                                                    <p
                                                        className={`text-xs font-semibold transition-all ${
                                                            todo.isCompleted
                                                                ? 'text-slate-400 line-through'
                                                                : 'text-slate-800'
                                                        }`}
                                                    >
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
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Popular Topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {userKeywords.slice(0, 5).map((kw, i) => (
                                <div
                                    key={i}
                                    className="px-3 py-1.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-indigo-100/50 rounded-full text-xs text-indigo-700 font-bold flex items-center gap-1.5 shadow-sm"
                                >
                                    {kw.keyword}
                                    <span className="bg-white/80 px-1.5 py-0.5 rounded text-[10px] shadow-sm">
                                        {kw.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* History List */}
                {history.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Recent Activity
                            </h3>
                            <Link
                                to="/dashboard"
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline uppercase tracking-tight"
                            >
                                View All
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {history.slice(0, 3).map((item) => (
                                <div
                                    key={item.id}
                                    className="group p-3 rounded-2xl bg-white/40 border border-slate-100 backdrop-blur-sm hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div
                                        className={`absolute top-0 left-0 w-1 h-full ${item.type === 'morning' ? 'bg-amber-400' : 'bg-indigo-500'} opacity-0 group-hover:opacity-100 transition-opacity`}
                                    />
                                    <div className="flex items-center justify-between mb-1 pl-2">
                                        <span
                                            className={`text-[9px] font-black uppercase tracking-widest ${item.type === 'morning' ? 'text-amber-500' : 'text-indigo-500'}`}
                                        >
                                            {item.type}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            {new Date(item.timestamp).toLocaleDateString([], {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-1 group-hover:text-slate-900 transition-colors pl-2 font-medium">
                                        {item.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100/50 mt-auto space-y-3 bg-white/30 backdrop-blur-md">
                <div className="bg-white/60 rounded-xl p-3 border border-slate-100/50 mb-2 shadow-sm backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Logged in as
                    </p>
                    <p className="text-xs font-bold text-slate-700 truncate">{userId}</p>
                </div>
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm group"
                >
                    <HiPlus size={18} className="group-hover:rotate-90 transition-transform" />
                    New Reflection
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-bold hover:bg-rose-100 hover:shadow-md hover:shadow-rose-100 transition-all"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
