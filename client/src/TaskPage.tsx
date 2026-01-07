import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiPlus,
    HiChat,
    HiViewGrid,
    HiTrash,
    HiCheckCircle,
    HiCalendar,
    HiLightningBolt,
    HiBell,
    HiClock,
    HiLocationMarker,
    HiUserGroup,
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
        case 'todo':
            return <HiCheckCircle className="text-blue-500" size={24} />;
        case 'event':
            return <HiCalendar className="text-purple-500" size={24} />;
        case 'habit':
            return <HiLightningBolt className="text-amber-500" size={24} />;
        case 'reminder':
            return <HiBell className="text-rose-500" size={24} />;
        default:
            return <HiViewGrid className="text-slate-500" size={24} />;
    }
};

// Type-specific data renderer
const TaskDataRenderer = ({ type, data }: { type: TaskType; data: any }) => {
    if (!data) return null;

    if (type === 'event') {
        return (
            <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <HiClock className="text-slate-400" />
                    <span>
                        {new Date(data.startTime).toLocaleString()} -{' '}
                        {new Date(data.endTime).toLocaleTimeString()}
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
                                <span
                                    key={i}
                                    className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs"
                                >
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
                        <input
                            type="checkbox"
                            checked={sub.completed}
                            readOnly
                            className="rounded border-slate-300"
                        />
                        <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                            {sub.title}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'habit') {
        return (
            <div className="text-sm text-slate-600">
                <span className="font-bold">Frequency:</span> {data.frequency}
                {data.streak !== undefined && (
                    <span className="ml-3">🔥 {data.streak} day streak</span>
                )}
            </div>
        );
    }

    // Default JSON dump for others or generic
    return (
        <div className="space-y-2 text-sm text-slate-600">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                        {key}
                    </span>
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
    const [isCreating, setIsCreating] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agentState, setAgentState] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTasks();
    }, [userId]);

    useEffect(() => {
        if (isCreating && messages.length === 0) {
            setMessages([
                {
                    sender: 'bot',
                    content:
                        "Hey! I'm Reflectly. Tell me about something you want to schedule, build a habit for, or just get done!",
                },
            ]);
        }
    }, [isCreating]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/tasks/${userId}`);
            setTasks(res.data.data);
        } catch (e) {
            console.error('Failed to fetch tasks', e);
        }
    };

    const handleSendMessage = async (e: React.FormEvent | string) => {
        if (typeof e !== 'string') e.preventDefault();
        const userMsg = typeof e === 'string' ? e : input;

        if (!userMsg.trim() || isSubmitting) return;

        setMessages((prev) => [...prev, { sender: 'user', content: userMsg }]);
        if (typeof e !== 'string') setInput('');
        setIsSubmitting(true);

        try {
            const res = await axios.post('http://localhost:3000/api/tasks/chat', {
                userId,
                message: userMsg,
                history: messages,
                previousState: agentState,
            });

            const botMsg = res.data.message;
            setMessages((prev) => [...prev, { sender: 'bot', content: botMsg }]);

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
            setMessages((prev) => [
                ...prev,
                { sender: 'bot', content: 'Oops, something went wrong on my end.' },
            ]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            await axios.delete(`http://localhost:3000/api/tasks/${taskToDelete}`);
            setTaskToDelete(null);
            fetchTasks();
        } catch (e) {
            console.error('Delete failed', e);
            setTaskToDelete(null);
        }
    };

    const handleFinishCreation = () => {
        setIsCreating(false);
        setMessages([]);
        setAgentState(null);
        fetchTasks();
    };

    const quickChips = [
        { label: '📅 Schedule Meeting', query: 'Schedule a team meeting for tomorrow at 2pm' },
        { label: '✅ Daily Habit', query: 'I want to start drinking 3L of water every day' },
        { label: '🔔 Set Reminder', query: 'Remind me to call the dentist in 1 hour' },
        { label: '📝 New Todo', query: 'Add a task to buy groceries today' },
    ];

    return (
        <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto relative font-sans">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {taskToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 text-center"
                        >
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6 mx-auto">
                                <HiTrash size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">
                                Delete Task?
                            </h3>
                            <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                                This will permanently remove this record. Ready to let it go?
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setTaskToDelete(null)}
                                    className="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteTask}
                                    className="px-6 py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Creation Experience Overlay */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-50/80 backdrop-blur-xl p-4 md:p-12"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.98 }}
                            className="w-full max-w-6xl h-full max-h-[900px] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] flex overflow-hidden border border-white"
                        >
                            {/* Left Panel: Chat */}
                            <div className="flex-[1.2] flex flex-col border-r border-slate-100 bg-slate-50/30">
                                <div className="p-8 flex items-center justify-between border-b border-slate-100 bg-white/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <HiChat size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-black text-slate-800 tracking-tight">
                                                Reflectly
                                            </h2>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                                    Always Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleFinishCreation}
                                        className="text-slate-400 hover:text-slate-600 p-2 transition-colors"
                                    >
                                        <HiPlus className="rotate-45" size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                x: msg.sender === 'user' ? 20 : -20,
                                            }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={idx}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] p-5 rounded-3xl leading-relaxed text-[15px] font-medium ${msg.sender === 'user'
                                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-100'
                                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm shadow-slate-100/50'
                                                    }`}
                                            >
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isSubmitting && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-slate-100 px-6 py-4 rounded-3xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="p-8 space-y-6 bg-white/50 border-t border-slate-100">
                                    <div className="flex flex-wrap gap-2">
                                        {messages.length < 3 &&
                                            quickChips.map((chip, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setInput(chip.query)}
                                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all active:scale-95"
                                                >
                                                    {chip.label}
                                                </button>
                                            ))}
                                    </div>

                                    <form onSubmit={handleSendMessage} className="relative group">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Tell me what to track..."
                                            className="w-full pl-6 pr-16 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500/30 focus:bg-white transition-all text-slate-700 font-medium placeholder:text-slate-300"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="submit"
                                            className="absolute right-3 top-3 bottom-3 aspect-square bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-indigo-100"
                                            disabled={!input.trim() || isSubmitting}
                                        >
                                            <HiChat size={22} />
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Right Panel: Live Preview */}
                            <div className="flex-1 bg-white p-10 flex flex-col">
                                <div className="mb-10">
                                    <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-2">
                                        Live Extraction
                                    </h3>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                        Draft View
                                    </h2>
                                </div>

                                <div className="flex-1 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 p-8 relative overflow-hidden">
                                    {!agentState?.partialTask?.title ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4 animate-pulse">
                                                <HiViewGrid size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold italic">
                                                Start chatting to see your task take shape in
                                                real-time...
                                            </p>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                    {getTaskIcon(agentState.partialTask.type)}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                                                        {agentState.partialTask.type}
                                                    </span>
                                                    <h4 className="text-xl font-black text-slate-800 line-clamp-2">
                                                        {agentState.partialTask.title}
                                                    </h4>
                                                </div>
                                            </div>

                                            {agentState.partialTask.summary && (
                                                <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                                                        "{agentState.partialTask.summary}"
                                                    </p>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Extracted Details
                                                </h5>
                                                <div className="bg-white overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm p-6">
                                                    <TaskDataRenderer
                                                        type={agentState.partialTask.type}
                                                        data={agentState.partialTask.data}
                                                    />
                                                </div>
                                            </div>

                                            {agentState.missingFields?.length > 0 && (
                                                <div className="absolute bottom-6 left-6 right-6">
                                                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                                            <HiClock size={16} />
                                                        </div>
                                                        <span className="text-xs font-bold text-amber-700 italic">
                                                            {agentState.missingFields.length} more
                                                            detail
                                                            {agentState.missingFields.length > 1
                                                                ? 's'
                                                                : ''}{' '}
                                                            needed...
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <p className="text-[10px] text-center text-slate-300 font-bold uppercase tracking-widest">
                                        Powered by Advanced Agentic Intelligence
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Task Dashboard */}
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                            <h1 className="text-5xl font-black text-slate-800 tracking-tight">
                                Focus
                            </h1>
                        </div>
                        <p className="text-slate-500 font-bold text-lg tracking-tight">
                            Organization meets intuition.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="group flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-100 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                    >
                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform">
                            <HiPlus size={20} />
                        </div>
                        New Task
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {tasks.length === 0 && (
                        <div className="col-span-full py-32 text-center">
                            <div className="w-32 h-32 bg-white rounded-[3rem] shadow-sm flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-50">
                                <HiViewGrid size={64} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                                Silence is gold, but planning is silver.
                            </h3>
                            <p className="text-slate-400 font-bold text-lg">
                                Use the command center to populate your universe.
                            </p>
                        </div>
                    )}
                    {tasks.map((task) => (
                        <motion.div
                            layout
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                        {getTaskIcon(task.type)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                                        {task.type}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTaskToDelete(task.id);
                                    }}
                                    className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <HiTrash size={20} />
                                </button>
                            </div>

                            <div className="space-y-2 mb-8">
                                <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight leading-none">
                                    {task.title}
                                </h3>
                                {task.summary && (
                                    <p className="text-slate-500 font-medium line-clamp-2 text-sm leading-relaxed">
                                        {task.summary}
                                    </p>
                                )}
                            </div>

                            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                                <TaskDataRenderer type={task.type} data={task.data} />
                            </div>

                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/20 to-transparent -mr-12 -mt-12 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskPage;
