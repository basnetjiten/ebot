import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Message, AnalysisResult, ReflectionEntry, UserKeyword, SuggestedTodo } from './types';
import Sidebar from './Sidebar';
import DashboardPage from './DashboardPage';
import ReflectionPage from './ReflectionPage';
import LoginPage from './LoginPage';
import TaskPage from './TaskPage';

function App() {
    const [isLoadingData, setIsLoadingData] = useState(true);

    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [reflectionType, setReflectionType] = useState<'morning' | 'evening'>('morning');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [lastReflectionId, setLastReflectionId] = useState<string | null>(null);
    const [todoStatus, setTodoStatus] = useState<{ uncompleted: number; completed: number } | null>(
        null,
    );
    const [userId, setUserId] = useState<string | null>(localStorage.getItem('ebot_userId'));
    const [history, setHistory] = useState<ReflectionEntry[]>([]);
    const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSubmitting]);

    const fetchUserData = async (id: string, skipMessages = false) => {
        setIsLoadingData(true);
        try {
            const response = await axios.get(`http://localhost:3000/api/users/${id}/summary`);
            const { latestReflection, history, keywords, analysisData } = response.data.data;

            setHistory(history || []);
            setUserKeywords(keywords || []);

            if (latestReflection) {
                setLastReflectionId(latestReflection.id);
                setReflectionType(latestReflection.type);

                if (!skipMessages) {
                    // Populate messages from the latest reflection
                    const initialMessages: Message[] = [
                        {
                            id: 'init-user',
                            sender: 'user',
                            content: latestReflection.content,
                            timestamp: new Date(latestReflection.timestamp),
                        },
                    ];

                    if (analysisData?.feedback) {
                        initialMessages.push({
                            id: 'init-bot',
                            sender: 'bot',
                            content: analysisData.feedback,
                            timestamp: new Date(latestReflection.timestamp),
                            analysisData: {
                                summary: analysisData.summary,
                                keywords: analysisData.keywords,
                                suggestedTodos: analysisData.suggestedTodos,
                            },
                        });
                        setAnalysisResult(analysisData);
                        setIsCompleted(true);
                    }

                    setMessages(initialMessages);
                }

                // Calculate todo status
                if (analysisData?.suggestedTodos) {
                    const completed = (analysisData.suggestedTodos as SuggestedTodo[]).filter(
                        (t: SuggestedTodo) => t.isCompleted,
                    ).length;
                    const uncompleted = analysisData.suggestedTodos.length - completed;
                    setTodoStatus({ completed, uncompleted });
                } else {
                    setTodoStatus(null);
                }
            } else {
                // Reset state for new user
                setMessages([]);
                setAnalysisResult(null);
                setIsCompleted(false);
                setTodoStatus(null);
                setLastReflectionId(null);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserData(userId);
        } else {
            setIsLoadingData(false);
        }
    }, [userId]);

    const addMessage = (sender: 'user' | 'bot', content: string, analysisData?: AnalysisResult) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            sender,
            content,
            timestamp: new Date(),
            analysisData,
        };
        setMessages((prev) => [...prev, newMessage]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSubmitting || !userId) return;

        const userContent = input;
        setInput('');
        addMessage('user', userContent);
        setIsSubmitting(true);

        try {
            const response = await axios.post('http://localhost:3000/api/reflections', {
                userId,
                type: reflectionType,
                content: userContent,
                lastReflectionId,
                messages: messages.map((m) => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.content,
                })),
                isFinishing: false,
            });

            const { analysis, reflection } = response.data.data;
            setLastReflectionId(reflection.id);

            // For chat, we only expect feedback, no heavy analysis
            addMessage('bot', analysis.feedback);
        } catch (error) {
            console.error('Submission error:', error);
            addMessage('bot', 'Sorry, I encountered an error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async () => {
        if (!userId || !lastReflectionId) return;
        setIsSubmitting(true);

        try {
            // Trigger final analysis with isFinishing: true
            const response = await axios.post('http://localhost:3000/api/reflections', {
                userId,
                type: reflectionType,
                content: 'Reflection complete', // Placeholder content for the finish action
                lastReflectionId,
                messages: messages.map((m) => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.content,
                })),
                isFinishing: true,
            });

            const { analysis } = response.data.data;

            // Update state with final analysis
            setAnalysisResult(analysis);
            setIsCompleted(true);

            // Update todo status
            if (analysis.suggestedTodos) {
                const completed = (analysis.suggestedTodos as SuggestedTodo[]).filter(
                    (t: SuggestedTodo) => t.isCompleted,
                ).length;
                const uncompleted = analysis.suggestedTodos.length - completed;
                setTodoStatus({ completed, uncompleted });
            }

            // Refresh history/keywords
            fetchUserData(userId, true);
        } catch (error) {
            console.error('Completion error:', error);
            addMessage('bot', 'Sorry, I encountered an error finishing the reflection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setAnalysisResult(null);
        setIsCompleted(false);
        setLastReflectionId(null);
        setTodoStatus(null);
        navigate('/reflection');
    };

    const handleLogout = () => {
        localStorage.removeItem('ebot_userId');
        setUserId(null);
        setMessages([]);
        setAnalysisResult(null);
        setIsCompleted(false);
        setHistory([]);
        setUserKeywords([]);
    };

    const handleToggleTodo = async (todoId: string, currentStatus: boolean) => {
        try {
            await axios.put(`http://localhost:3000/api/todos/${todoId}`, {
                isCompleted: !currentStatus,
            });

            // Update local state for suggested todos
            if (analysisResult?.suggestedTodos) {
                const updatedTodos = analysisResult.suggestedTodos.map((todo) =>
                    todo.id === todoId ? { ...todo, isCompleted: !currentStatus } : todo,
                );
                setAnalysisResult({ ...analysisResult, suggestedTodos: updatedTodos });

                // Update uncompleted/completed counts
                const completed = updatedTodos.filter((t) => t.isCompleted).length;
                const uncompleted = updatedTodos.length - completed;
                setTodoStatus({ completed, uncompleted });
            }

            // Update history state
            setHistory((prevHistory) =>
                prevHistory.map((reflection) => {
                    if (reflection.suggestedTodos) {
                        return {
                            ...reflection,
                            suggestedTodos: reflection.suggestedTodos.map((todo) =>
                                todo.id === todoId
                                    ? { ...todo, isCompleted: !currentStatus }
                                    : todo,
                            ),
                        };
                    }
                    return reflection;
                }),
            );
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const handleDeleteReflection = async (reflectionId: string) => {
        if (!userId) return;

        try {
            await axios.delete(`http://localhost:3000/api/reflections/${reflectionId}`);

            // Update local state
            setHistory((prevHistory) => prevHistory.filter((r) => r.id !== reflectionId));

            // If this was the current reflection, reset the chat
            if (lastReflectionId === reflectionId) {
                setMessages([]);
                setAnalysisResult(null);
                setIsCompleted(false);
                setLastReflectionId(null);
                setTodoStatus(null);
            }
        } catch (error) {
            console.error('Error deleting reflection:', error);
        }
    };

    if (!userId) {
        return (
            <LoginPage
                onLoginSuccess={(id) => {
                    setUserId(id);
                    localStorage.setItem('ebot_userId', id);
                    navigate('/dashboard');
                }}
            />
        );
    }

    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold tracking-widest text-xs uppercase animate-pulse">
                        Loading Experience...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50 font-sans h-screen overflow-hidden">
            <Sidebar
                userId={userId}
                onNewChat={handleNewChat}
                onLogout={handleLogout}
                history={history}
                userKeywords={userKeywords}
                analysisResult={analysisResult}
                onToggleTodo={handleToggleTodo}
            />

            <main className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                        path="/reflection"
                        element={
                            <ReflectionPage
                                messages={messages}
                                input={input}
                                setInput={setInput}
                                isSubmitting={isSubmitting}
                                isCompleted={isCompleted}
                                reflectionType={reflectionType}
                                setReflectionType={setReflectionType}
                                handleSubmit={handleSubmit}
                                handleComplete={handleComplete}
                                todoStatus={todoStatus}
                                chatEndRef={chatEndRef}
                                onToggleTodo={handleToggleTodo}
                            />
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <DashboardPage
                                history={history}
                                onToggleTodo={handleToggleTodo}
                                onDeleteReflection={handleDeleteReflection}
                            />
                        }
                    />
                    {userId && <Route path="/tasks" element={<TaskPage userId={userId} />} />}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
