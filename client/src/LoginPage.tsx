import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HiSparkles, HiPaperAirplane } from 'react-icons/hi';

interface LoginPageProps {
    onLoginSuccess: (userId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [loginEmail, setLoginEmail] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginEmail.trim() || isLoggingIn) return;

        setIsLoggingIn(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:3000/api/login', {
                email: loginEmail.toLowerCase().trim()
            });
            const user = response.data.data;
            onLoginSuccess(user.id);
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-10 border border-slate-100"
            >
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-200 mb-6 rotate-3">
                        <HiSparkles size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome to E-Bot</h1>
                    <p className="text-slate-500 mt-2">Enter your email to start reflecting</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-slate-700"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full bg-sky-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoggingIn ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Connect <HiPaperAirplane className="rotate-90" />
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 text-center text-rose-500 text-sm font-medium"
                    >
                        {error}
                    </motion.p>
                )}

                <p className="mt-10 text-center text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                    Your Personal AI Companion
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
