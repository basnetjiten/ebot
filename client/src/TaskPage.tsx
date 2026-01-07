import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiPlus, HiChat, HiViewGrid, HiTrash,
    HiCheckCircle, HiCalendar, HiLightningBolt, HiBell, HiClock, HiLocationMarker, HiUserGroup
} from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type TaskType = 'todo' | 'event' | 'habit' | 'reminder';

interface Task {
    id: string;
    title: string;
    summary?: string;
    type: TaskType;
    data: Record<string, any>;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

interface Message {
    sender: 'user' | 'bot';
    content: string;
}

interface TaskPageProps {
    userId: string;
}

// Icon helper
const getTaskIcon = (type: TaskType) => {
    switch (type) {
        case 'todo': return <HiCheckCircle className="text-blue-500" size={24} />;
        case 'event': return <HiCalendar className="text-purple-500" size={24} />;
        case 'habit': return <HiLightningBolt className="text-amber-500" size={24} />;
        case 'reminder': return <HiBell className="text-rose-500" size={24} />;
        default: return <HiViewGrid className="text-slate-500" size={24} />;
    }
};

// Type-specific data renderer
const TaskDataRenderer = ({ type, data }: { type: TaskType, data: any }) => {
    if (!data) return null;

    if (type === 'event') {
        return (
            <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <HiClock className="text-slate-400" />
                    <span>
                        {new Date(data.startTime).toLocaleString()} - {new Date(data.endTime).toLocaleTimeString()}
                    </span>
                </div>
                {data.location && (
                    <div className="flex items-center gap-2">
                        <HiLocationMarker className="text-slate-400" />
                        <span>{data.location}</span>
                    </div>
                )}
                {data.attendees && data.attendees.length > 0 && (
                    <div className="flex items-start gap-2">
                        <HiUserGroup className="text-slate-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                            {data.attendees.map((attendee: string, i: number) => (
                                <span key={i} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                                    {attendee}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (type === 'todo' && data.subtasks) {
        return (
            <div className="space-y-1 mt-2">
                {data.subtasks.map((sub: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={sub.completed} readOnly className="rounded border-slate-300" />
                        <span className={sub.completed ? "line-through text-slate-400" : ""}>{sub.title}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'habit') {
        return (
            <div className="text-sm text-slate-600">
                <span className="font-bold">Frequency:</span> {data.frequency}
                {data.streak !== undefined && <span className="ml-3">🔥 {data.streak} day streak</span>}
            </div>
        );
    }

    // Default JSON dump for others or generic
    return (
        <div className="space-y-2 text-sm text-slate-600">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400">{key}</span>
                    <div className="bg-slate-50 p-2 rounded-md overflow-x-auto">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const TaskPage: React.FC<TaskPageProps> = ({ userId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Persist agent state across chat turns (for this session)
    const [agentState, setAgentState] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTasks();
    }, [userId]);

    useEffect(() => {
        if (viewMode === 'create' && messages.length === 0) {
            setMessages([{ sender: 'bot', content: "Hi! I can create Todos, Events, Habits, or Reminders. What's on your mind?" }]);
        }
    }, [viewMode]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/tasks/${userId}`);
            setTasks(res.data.data);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSubmitting) return;

        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', content: userMsg }]);
        setInput('');
        setIsSubmitting(true);

        try {
            const res = await axios.post('http://localhost:3000/api/tasks/chat', {
                userId,
                message: userMsg,
                history: messages,
                previousState: agentState
            });

            const botMsg = res.data.message;
            setMessages(prev => [...prev, { sender: 'bot', content: botMsg }]);

            if (res.data.state) {
                setAgentState(res.data.state);
                if (res.data.state.isComplete) {
                    setTimeout(() => {
                        fetchTasks();
                    }, 1000);
                }
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'bot', content: "Sorry, something went wrong." }]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("Delete this task?")) return;
        try {
            await axios.delete(`http://localhost:3000/api/tasks/${id}`);
            fetchTasks();
        } catch (e) { console.error(e) }
    };

    const handleFinishCreation = () => {
        setViewMode('list');
        setMessages([]);
        setAgentState(null);
        fetchTasks();
    };

    return (
        <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto relative font-sans">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tasks</h1>
                    <p className="text-slate-500 font-medium">Create Todos, Events, Habits & Reminders</p>
                </div>
                {viewMode === 'list' ? (
                    <button
                        onClick={() => setViewMode('create')}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all"
                    >
                        <HiPlus size={20} /> New Task
                    </button>
                ) : (
                    <button
                        onClick={handleFinishCreation}
                        className="px-5 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                        Back to List
                    </button>
                )}
            </header>

            <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {tasks.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 mx-auto mb-4">
                                    <HiViewGrid size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700">No tasks yet</h3>
                                <p className="text-slate-500">Chat with AI to create your first task.</p>
                            </div>
                        )}
                        {tasks.map(task => (
                            <div key={task.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        {getTaskIcon(task.type)}
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${task.type === 'event' ? 'border-purple-200 text-purple-600 bg-purple-50' :
                                                task.type === 'habit' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                                                    task.type === 'reminder' ? 'border-rose-200 text-rose-600 bg-rose-50' :
                                                        'border-blue-200 text-blue-600 bg-blue-50'
                                            }`}>
                                            {task.type}
                                        </span>
                                    </div>
                                    <button onClick={() => handleDeleteTask(task.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                        <HiTrash size={18} />
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{task.title}</h3>
                                {task.summary && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.summary}</p>}

                                <div className="mt-2 border-t border-slate-50 pt-2 bg-slate-50/50 -mx-6 px-6 pb-2 -mb-6 rounded-b-2xl">
                                    <TaskDataRenderer type={task.type} data={task.data} />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-2xl mx-auto h-[600px] flex flex-col bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none shadow-sm'
                                        }`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isSubmitting && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75" />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Describe your task..."
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="submit"
                                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                                    disabled={!input.trim() || isSubmitting}
                                >
                                    <HiChat size={20} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskPage;
